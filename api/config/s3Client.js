import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

// Construct endpoint dynamically from R2_ACCOUNT_ID
const accountId = process.env.R2_ACCOUNT_ID;
const endpoint = accountId 
  ? `https://${accountId}.r2.cloudflarestorage.com`
  : process.env.R2_ENDPOINT_URL;

// Initialize the S3 Client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto', // Cloudflare R2 requires region to be 'auto'
  endpoint: endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default s3Client;
