import { Role } from '@prisma/client'
import { type SerializeFrom } from '@remix-run/node'
import { useRouteLoaderData } from '@remix-run/react'
import { type loader as rootLoader } from '~/root'

function isUser(user: unknown): user is SerializeFrom<typeof rootLoader>['user'] {
	return (
		typeof user === 'object' &&
		user !== null &&
		'id' in user &&
		typeof (user as { id: unknown }).id === 'string'
	);
}

export function useOptionalUser() {
	const data = useRouteLoaderData<typeof rootLoader>('root')
	if (!data || !isUser(data.user)) {
		return undefined
	}
	return data.user
}

export function useUser() {
	const maybeUser = useOptionalUser()
	if (!maybeUser) {
		throw new Error(
			'No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead.',
		)
	}
	return maybeUser
}

type Action = 'create' | 'read' | 'update' | 'delete'
type Entity = 'user' | 'note'
type Access = 'own' | 'any' | 'own,any' | 'any,own'
export type PermissionString =
	| `${Action}:${Entity}`
	| `${Action}:${Entity}:${Access}`

export function parsePermissionString(permissionString: PermissionString) {
	const [action, entity, access] = permissionString.split(':') as [
		Action,
		Entity,
		Access | undefined,
	]
	return {
		action,
		entity,
		access: access ? (access.split(',') as Array<Access>) : undefined,
	}
}

export function userHasPermission(
	user: Pick<ReturnType<typeof useUser>, 'roles'> | null | undefined,
	permission: PermissionString,
) {
	if (!user) return false
	const { action, entity, access } = parsePermissionString(permission)
	return user.roles.some((role) =>
		role.permissions.some(
			(permission) =>
				permission.entity === entity &&
				permission.action === action &&
				(!access || access.includes(permission.access)),
		),
	)
}

export function userHasRole(
	user: Pick<ReturnType<typeof useUser>, 'roles'> | null,
	role: string,
) {
	if (!user) return false
	return user.roles.some((r: Role) => r.name === role)
}
