import type { Readable } from "node:stream";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../env";

export function createS3Client() {
  const region =
    process.env.S3_REGION === "" ? undefined : process.env.S3_REGION;
  const credentials =
    process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
      : undefined;

  // The SDK throws on an empty region; S3-compatible providers don't need a real one.
  return new S3Client({
    region: region ?? "us-east-1",
    endpoint: process.env.S3_ENDPOINT ?? "",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials,
    // Browser uploads do not carry the SDK-computed optional checksum after the
    // URL has been signed. Requiring checksums only for S3 operations that
    // mandate them also keeps compatible providers such as Garage from
    // rejecting the uploaded body with InvalidDigest.
    requestChecksumCalculation: "WHEN_REQUIRED",
  });
}

export async function generateUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn = 3600,
) {
  const client = createS3Client();
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  );
}

const contentDisposition = (filename: string) =>
  `attachment; filename="${filename.replace(/[^\x20-\x7e]|["\\]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`;

export async function generateDownloadUrl(
  bucket: string,
  key: string,
  expiresIn = 3600,
  downloadFilename?: string,
) {
  const client = createS3Client();
  return getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ...(downloadFilename !== undefined && {
        ResponseContentDisposition: contentDisposition(downloadFilename),
      }),
    }),
    { expiresIn },
  );
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer | Readable,
  contentType: string,
  contentLength: number,
) {
  await new Upload({
    client: createS3Client(),
    params: {
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      ContentLength: contentLength,
    },
    leavePartsOnError: false,
  }).done();
}

export async function deleteObject(bucket: string, key: string) {
  const client = createS3Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

/**
 * Resolve an avatar key to its public URL.
 * Returns an absolute URL unchanged to support externally hosted provider avatars.
 */
export function getAvatarUrl(
  imageOrKey: string | null | undefined,
): string | null {
  if (!imageOrKey) {
    return null;
  }

  if (
    imageOrKey.startsWith("http://") ||
    imageOrKey.startsWith("https://")
  ) {
    return imageOrKey;
  }

  const avatarUrl = env("NEXT_PUBLIC_AVATAR_URL")?.replace(/\/$/, "");
  if (avatarUrl) {
    return `${avatarUrl}/${imageOrKey}`;
  }

  const useVirtualHosted =
    env("NEXT_PUBLIC_USE_VIRTUAL_HOSTED_URLS") === "true";
  const storageDomain = env("NEXT_PUBLIC_STORAGE_DOMAIN");
  const storageUrl = env("NEXT_PUBLIC_STORAGE_URL");
  const bucket = env("NEXT_PUBLIC_AVATAR_BUCKET_NAME");

  if (useVirtualHosted && storageDomain && bucket) {
    return `https://${bucket}.${storageDomain}/${imageOrKey}`;
  }

  if (storageUrl && bucket) {
    return `${storageUrl}/${bucket}/${imageOrKey}`;
  }

  return null;
}

/**
 * Generate presigned URL for an avatar image
 * Returns the URL as-is if it's already a full URL (external provider)
 * Returns presigned URL if it's an S3 key
 * Returns null if image key is missing, bucket is not configured, or URL generation fails
 */
export async function generateAvatarUrl(
  imageKey: string | null | undefined,
  expiresIn = 86400,
): Promise<string | null> {
  if (!imageKey) {
    return null;
  }

  if (imageKey.startsWith("http://") || imageKey.startsWith("https://")) {
    return imageKey;
  }

  const bucket = env("NEXT_PUBLIC_AVATAR_BUCKET_NAME");
  if (!bucket) {
    return null;
  }

  try {
    return await generateDownloadUrl(bucket, imageKey, expiresIn);
  } catch {
    return null;
  }
}

export async function generateAttachmentUrl(
  attachmentKey: string | null | undefined,
  expiresIn = 86400,
  downloadFilename?: string,
): Promise<string | null> {
  if (!attachmentKey) {
    return null;
  }

  const bucket = env("NEXT_PUBLIC_ATTACHMENTS_BUCKET_NAME");
  if (!bucket) {
    return null;
  }

  try {
    return await generateDownloadUrl(
      bucket,
      attachmentKey,
      expiresIn,
      downloadFilename,
    );
  } catch {
    return null;
  }
}
