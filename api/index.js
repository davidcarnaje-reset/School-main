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

// I-load ang environment variables
dotenv.config();

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*', // Pwede nating higpitan ito kapag production na sa Vercel
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// =======================================================
// [ ROUTE MAPPER: IMIMITATE NATIN ANG ATING PHP FOLDER TREE ]
// =======================================================

// 1. Auth Branch (Na-convert na sa Yugto 4)
app.use('/api/auth', authRoutes);

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

// Global Fallback Error Handler
app.use((req, res) => {
  res.status(404).json({ status: "error", message: "Endpoint not found in SMS Cloud API" });
});

export default app;
