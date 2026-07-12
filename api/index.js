import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './controllers/auth/authRouter.js';
import lmsRoutes from './routes/lmsRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import cashierRoutes from './routes/cashierRoutes.js';
import registrarRoutes from './routes/registrarRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import smokeTestRoutes from './routes/smokeTest.js';
import adminRoutes from './routes/adminRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import schoolRoutes from './routes/schoolRoutes.js';
import { getPublicPromotions } from './controllers/admin/promotion.js';

// I-load ang environment variables
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*', // Pwede nating higpitan ito kapag production na sa Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-school-id']
}));
app.use(express.json());

// Global multi-tenant school extractor middleware
app.use((req, res, next) => {
  const schoolId = req.headers['x-school-id'] || req.query.school_id;
  req.school_id = schoolId ? parseInt(schoolId, 10) : 1;
  next();
});

// =======================================================
// [ ROUTE MAPPER: IMIMITATE NATIN ANG ATING PHP FOLDER TREE ]
// =======================================================

// 1. Auth Branch (Na-convert na sa Yugto 4)
app.use('/api/auth', authRoutes);

// Schools Branch (Multi-Tenant)
app.use('/api/schools', schoolRoutes);

// 1.5. Admin Branch (Branding Engine, etc.)
app.use('/api/admin', adminRoutes);

// 1.6. Static Asset Serving
app.use('/api/uploads', express.static('uploads'));

// 1.7. Public Landing Page Banners
app.get('/api/public/promotions', getPublicPromotions);
app.get('/api/public/get_promotions.php', getPublicPromotions);



// 2. LMS Branch
app.use('/api/lms', lmsRoutes);

// 3. Messages Branch
app.use('/api/messages', messageRoutes);

// 4. Notifications Branch
app.use('/api/notifications', notificationRoutes);

// 5. Cashier Branch
app.use('/api/cashier', cashierRoutes);

// 6. Registrar Branch
app.use('/api/registrar', registrarRoutes);

// 7. Student Portal General Data
app.use('/api/student', studentRoutes);

// 7.5. Teacher Portal
app.use('/api/teacher', teacherRoutes);

// 7.6. User Settings
app.use('/api/settings', settingsRoutes);

// 8. Health & Utility Endpoints (for Vercel)
app.use('/api/test', smokeTestRoutes);

// Global Fallback Error Handler
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Endpoint not found in SMS Cloud API" });
});

export default app;
