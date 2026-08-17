import app from './app';
import { connectDB } from './config/db';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
  } catch (e) {
    console.warn('DB connect error in lambda handler:', e);
  }
  return app(req, res);
}
