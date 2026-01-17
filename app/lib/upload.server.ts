import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { FileUpload } from "@mjackson/form-data-parser";
import { createId } from "@paralleldrive/cuid2";

const STORAGE_ENDPOINT = process.env.AWS_ENDPOINT_URL_S3;
const STORAGE_BUCKET = process.env.BUCKET_NAME;
const STORAGE_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const STORAGE_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const STORAGE_REGION = process.env.AWS_REGION;

const s3 = new S3Client({
  region: STORAGE_REGION,
  endpoint: STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: STORAGE_ACCESS_KEY,
    secretAccessKey: STORAGE_SECRET_KEY,
  },
});

export type Uploadable =
  | File
  | FileUpload
  | { name?: string; type: string; stream: () => any };

async function uploadToStorage(file: Uploadable, key: string) {
  const body = file.stream();

  try {
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: STORAGE_BUCKET,
        Key: key,
        Body: body,
        ContentType: file.type,
      },
    });

    await upload.done();
  } catch (error) {
    console.error("Failed to upload file to storage:", error);
    throw new Error(`Failed to upload object: ${key}`);
  }

  return key;
}

export async function uploadProfileImage(userId: string, file: Uploadable) {
  const fileId = createId();
  let fileExtension = "";
  if (file.name?.includes(".")) {
    fileExtension = file.name.split(".").pop() || "";
  } else if (file.type) {
    const ext = file.type.split("/")[1];
    if (ext) fileExtension = ext;
  }
  const timestamp = Date.now();
  const key = `users/${userId}/profile-images/${timestamp}-${fileId}.${fileExtension}`;
  return uploadToStorage(file, key);
}

export async function getSignedGetRequestInfo(key: string) {
  const command = new GetObjectCommand({
    Bucket: STORAGE_BUCKET,
    Key: key,
  });

  // Generate a presigned URL valid for 1 hour
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

  return {
    url,
    error: null,
  };
}
