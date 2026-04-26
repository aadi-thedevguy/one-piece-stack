import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Connection, Password, User } from "prisma/generated/client";
import { data, redirect } from "react-router";
import { safeRedirect } from "remix-utils/safe-redirect";
import { sessionKey } from "~/constants/keys";
import {
  combineHeaders,
  type PermissionString,
  parsePermissionString,
} from "~/lib/utils";
import { prisma } from "../db.server";
import { uploadProfileImage } from "../upload.server";
import { authSessionStorage } from "./session.server";

const REG_EXP = /\r?\n/;

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30;
export const getSessionExpirationDate = () =>
  new Date(Date.now() + SESSION_EXPIRATION_TIME);

export async function getUserId(request: Request) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  const sessionId = authSession.get(sessionKey);
  if (!sessionId) return null;
  const session = await prisma.session.findUnique({
    select: { userId: true, user: { select: { active: true } } },
    where: { id: sessionId, expirationDate: { gt: new Date() } },
  });
  if (!(session?.userId && session.user.active)) {
    throw redirect("/", {
      headers: {
        "set-cookie": await authSessionStorage.destroySession(authSession),
      },
    });
  }
  return session.userId;
}

export async function requireUserId(
  request: Request,
  { redirectTo }: { redirectTo?: string | null } = {}
) {
  const userId = await getUserId(request);
  if (!userId) {
    const requestUrl = new URL(request.url);
    redirectTo =
      redirectTo === null
        ? null
        : (redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`);
    const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null;
    const loginRedirect = ["/login", loginParams?.toString()]
      .filter(Boolean)
      .join("?");
    throw redirect(loginRedirect);
  }
  return userId;
}

export async function requireUserWithRole(request: Request, name: string) {
  const userId = await requireUserId(request);
  const user = await prisma.user.findFirst({
    select: { id: true },
    where: { id: userId, roles: { some: { name } } },
  });
  if (!user) {
    throw data(
      {
        error: "Unauthorized",
        requiredRole: name,
        message: `Unauthorized: required role: ${name}`,
      },
      { status: 403 }
    );
  }
  return user.id;
}

export async function requireUserWithPermission(
  request: Request,
  permission: PermissionString
) {
  const userId = await requireUserId(request);
  const permissionData = parsePermissionString(permission);
  const user = await prisma.user.findFirst({
    select: { id: true },
    where: {
      id: userId,
      roles: {
        some: {
          permissions: {
            some: {
              ...permissionData,
              access: permissionData.access
                ? { in: permissionData.access }
                : undefined,
            },
          },
        },
      },
    },
  });
  if (!user) {
    throw data(
      {
        error: "Unauthorized",
        requiredPermission: permissionData,
        message: `Unauthorized: required permissions: ${permission}`,
      },
      { status: 403 }
    );
  }
  return user.id;
}

export async function login({
  username,
  password,
}: {
  username: User["username"];
  password: string;
}) {
  const user = await verifyUserPassword({ username }, password);
  if (!user) return null;
  const session = await prisma.session.create({
    select: { id: true, expirationDate: true, userId: true },
    data: {
      expirationDate: getSessionExpirationDate(),
      userId: user.id,
    },
  });
  return session;
}

export async function resetUserPassword({
  username,
  password,
}: {
  username: User["username"];
  password: string;
}) {
  const hashedPassword = await getPasswordHash(password);
  return prisma.user.update({
    where: { username },
    data: {
      password: {
        update: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function signup({
  email,
  username,
  password,
  name,
}: {
  email: User["email"];
  username: User["username"];
  name: User["name"];
  password: string;
}) {
  const hashedPassword = await getPasswordHash(password);

  const session = await prisma.session.create({
    data: {
      expirationDate: getSessionExpirationDate(),
      user: {
        create: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          name,
          roles: { connect: { name: "user" } },
          password: {
            create: {
              hash: hashedPassword,
            },
          },
        },
      },
    },
    select: { id: true, expirationDate: true },
  });

  return session;
}

export async function signupWithConnection({
  email,
  username,
  name,
  providerId,
  providerName,
  imageUrl,
}: {
  email: User["email"];
  username: User["username"];
  name: User["name"];
  providerId: Connection["providerId"];
  providerName: Connection["providerName"];
  imageUrl?: string;
}) {
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      name,
      roles: { connect: { name: "user" } },
      connections: { create: { providerId, providerName } },
    },
    select: { id: true },
  });

  if (imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (response.ok && response.body) {
        const objectKey = await uploadProfileImage(user.id, {
          type: response.headers.get("content-type") || "image/jpeg",
          stream: () => response.body,
        });

        await prisma.user.update({
          where: { id: user.id },
          data: { image: { create: { objectKey } } },
        });
      }
    } catch (error) {
      console.error("Failed to upload profile image during signup:", error);
    }
  }

  // Create and return the session
  const session = await prisma.session.create({
    data: {
      expirationDate: getSessionExpirationDate(),
      userId: user.id,
    },
    select: { id: true, expirationDate: true },
  });

  return session;
}

export async function logout(
  {
    request,
    redirectTo = "/",
  }: {
    request: Request;
    redirectTo?: string;
  },
  responseInit?: ResponseInit
) {
  const authSession = await authSessionStorage.getSession(
    request.headers.get("cookie")
  );
  const sessionId = authSession.get(sessionKey);
  // if this fails, we still need to delete the session from the user's browser
  // and it doesn't do any harm staying in the db anyway.
  if (sessionId) {
    // the .catch is important because that's what triggers the query.
    // learn more about PrismaPromise: https://www.prisma.io/docs/orm/reference/prisma-client-reference#prismapromise-behavior
    prisma.session.deleteMany({ where: { id: sessionId } }).catch((error) => {
      console.error(error);
    });
  }
  throw redirect(safeRedirect(redirectTo), {
    ...responseInit,
    headers: combineHeaders(
      { "set-cookie": await authSessionStorage.destroySession(authSession) },
      responseInit?.headers
    ),
  });
}

export async function getPasswordHash(password: string) {
  const hash = await bcrypt.hash(password, 10);
  return hash;
}

export async function verifyUserPassword(
  where: Pick<User, "username"> | Pick<User, "id">,
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where,
    select: { id: true, active: true, password: { select: { hash: true } } },
  });

  if (!(userWithPassword?.password && userWithPassword.active)) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  return { id: userWithPassword.id };
}

export function getPasswordHashParts(password: string) {
  const hash = crypto
    .createHash("sha1")
    .update(password, "utf8")
    .digest("hex")
    .toUpperCase();
  return [hash.slice(0, 5), hash.slice(5)] as const;
}

export async function checkIsCommonPassword(password: string) {
  if (process.env.NODE_ENV === "development") return false;
  const [prefix, suffix] = getPasswordHashParts(password);

  try {
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      { signal: AbortSignal.timeout(1000) }
    );

    if (!response.ok) return false;

    const data = await response.text();
    return data.split(REG_EXP).some((line) => {
      const [hashSuffix] = line.split(":");
      return hashSuffix === suffix;
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.warn("Password check timed out");
      return false;
    }

    console.warn("Unknown error during password check", error);
    return false;
  }
}
