import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import s3Client from '../config/s3Client.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

// I-initialize ang multer para pansamantalang hawakan ang file sa RAM memory
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @desc    Test file deployment directly to Cloudflare R2 bucket infrastructure
 * @route   POST /api/test/upload-check
 */
router.post('/upload-check', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'Pakisuyong maglagay ng file sa [avatar] field.' });
        }

        // 1. Gumawa ng highly unique filename hash para hindi magka-duplicate sa cloud bucket
        const uniqueFileHash = crypto.randomBytes(16).toString('hex');
        const fileExtension = req.file.originalname.split('.').pop();
        const targetFileName = `test-uploads/avatar_${uniqueFileHash}.${fileExtension}`;

        // 2. I-prepare ang standard S3 upload binary mapping rules
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: targetFileName,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        // 3. Pasabugin ang write command papuntang Cloudflare servers
        await s3Client.send(uploadCommand);

        // 4. I-construct ang production public storage pointer
        const publicAssetUrl = `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}/${targetFileName}`;

        res.status(200).json({
            status: 'success',
            message: '🚀 Cloudflare R2 Upload validation: SUCCESSFUL!',
            meta: {
                original_name: req.file.originalname,
                mime_type: req.file.mimetype,
                allocated_bucket: process.env.R2_BUCKET_NAME,
                cloud_storage_key: targetFileName,
                simulated_public_url: publicAssetUrl
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: '❌ Cloudflare R2 connection write operation failed.',
            error: error.message
        });
    }
});

export default router;