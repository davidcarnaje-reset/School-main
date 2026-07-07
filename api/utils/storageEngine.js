import s3Client from '../config/s3Client.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * Uploads a file buffer to Cloudflare R2 using the S3 SDK client.
 * Returns the public access URL of the uploaded object.
 *
 * @param {Buffer} fileBuffer The binary data of the file
 * @param {string} uniqueFileName The unique name/key under which the file will be saved
 * @param {string} mimeType The MIME type of the file (e.g. image/png)
 * @returns {Promise<string>} The publicly accessible URL path
 */
export const uploadFileToCloud = async (fileBuffer, uniqueFileName, mimeType) => {
  const bucketName = process.env.R2_BUCKET_NAME || 'sms-cdn';
  
  // Construct the PutObjectCommand
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: uniqueFileName,
    Body: fileBuffer,
    ContentType: mimeType,
  });

  // Upload to Cloudflare R2
  await s3Client.send(command);

  const publicUrl = process.env.R2_PUBLIC_URL || 'https://pub-5204e5f89d6c4f8ea9b7c2f2fd992041.r2.dev';
  return `${publicUrl}/${uniqueFileName}`;
};

/**
 * Phase 2 Specific Alias Helper for R2 upload handler
 */
export const uploadToR2 = async (fileBuffer, fileName, mimeType) => {
  return uploadFileToCloud(fileBuffer, fileName, mimeType);
};
