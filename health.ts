/**
 * Health check handler at project root level
 */
import type { Request, Response } from 'express';
import apiHealthHandler from './api/health.js';

export default async function handler(req: Request, res: Response) {
  return apiHealthHandler(req, res);
}
