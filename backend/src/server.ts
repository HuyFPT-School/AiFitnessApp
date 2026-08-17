import { Request, Response } from 'express';
import app from './app';

const PORT = Number(process.env.PORT) || 5050;

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'AI FitCoach Backend API',
    status: 'ONLINE',
    time: new Date().toISOString()
  });
});

// Start Server on 0.0.0.0 for Cloud Platforms (Render, Railway)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`⚡ AI FitCoach Backend Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`======================================================\n`);
});

export default app;
