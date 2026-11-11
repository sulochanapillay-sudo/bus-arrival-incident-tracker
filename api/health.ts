import type { Request, Response } from 'express';
import { resolveAccountKey } from './_ltaClient.js';

export default async function handler(req: Request, res: Response) {
  const accountKey = resolveAccountKey(req);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    ltaAccountKeyConfigured: Boolean(accountKey && accountKey.length > 0),
    endpoints: {
      busArrivalV3: '/api/BusArrival?BusStopCode=83139',
      trafficIncidents: '/api/TrafficIncidents',
      trainServiceAlerts: '/api/TrainServiceAlerts',
      carparkAvailability: '/api/CarParkAvailability',
      health: '/api/health',
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  });
}
