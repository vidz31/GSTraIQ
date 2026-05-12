import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import copilotRoutes from './routes/copilotRoutes.js';
import cashflowRoutes from './routes/cashflowRoutes.js';
import businessRoutes from './routes/businessRoutes.js';

import { spawn } from 'child_process';
import path from 'path';

dotenv.config();

connectDB();

// Function to start the ML Service automatically
const startMLService = () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      const pythonCmd = 'python';
      const mlPath = path.resolve(process.cwd(), '..', 'ml-service', 'app.py');
      
      console.log(`🚀 Starting ML Engine: ${pythonCmd} "${mlPath}"`);
      
      const pythonProcess = spawn(pythonCmd, ['app.py'], { 
        cwd: path.resolve(process.cwd(), '..', 'ml-service'),
        stdio: 'inherit', 
        shell: true 
      });
      
      pythonProcess.on('error', (err) => {
        console.warn('⚠️ ML Engine failed to start automatically:', err.message);
      });
    }
  } catch (err) {
    console.error('Error in startMLService:', err.message);
  }
};

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/copilot', copilotRoutes);
app.use('/api/cashflow', cashflowRoutes);
app.use('/api/businesses', businessRoutes);

app.get('/', (req, res) => {
  res.send('GSTraIQ API is running...');
});

// Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    startMLService();
  }
);
