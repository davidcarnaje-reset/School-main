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

  // Extract Account ID from the R2_ENDPOINT to construct public r2.dev subdomain
  const endpoint = process.env.R2_ENDPOINT || '';
  const accountId = endpoint.replace('https://', '').split('.')[0];

  // Return the standard Cloudflare R2 public URL
  return `https://pub-${accountId}.r2.dev/${uniqueFileName}`;
};

/**
 * Phase 2 Specific Alias Helper for R2 upload handler
 */
export const uploadToR2 = async (fileBuffer, fileName, mimeType) => {
  return uploadFileToCloud(fileBuffer, fileName, mimeType);
};
