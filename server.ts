import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  busArrivalHandler,
  trafficIncidentsHandler,
  trainServiceAlertsHandler,
  carParkAvailabilityHandler,
  healthHandler,
} from './api/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // CORS headers for API calls
  app.use('/api', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, accountkey, x-account-key');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Health check routes (/health and /api/health)
  app.get('/health', healthHandler);
  app.get('/api/health', healthHandler);

  // Next buses at a stop (v3 - current version; 20-second refresh)
  app.get('/api/BusArrival', busArrivalHandler);
  app.get('/api/v3/BusArrival', busArrivalHandler);
  app.get('/api/bus-arrival', busArrivalHandler);

  // Traffic incidents
  app.get('/api/TrafficIncidents', trafficIncidentsHandler);
  app.get('/api/traffic-incidents', trafficIncidentsHandler);

  // MRT/LRT status
  app.get('/api/TrainServiceAlerts', trainServiceAlertsHandler);
  app.get('/api/train-service-alerts', trainServiceAlertsHandler);

  // Carpark lot availabilities
  app.get('/api/CarParkAvailability', carParkAvailabilityHandler);
  app.get('/api/CarParkAvailabilityv2', carParkAvailabilityHandler);
  app.get('/api/carpark-availability', carParkAvailabilityHandler);

  // Frontend Serving
  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG TransitPulse server running on http://0.0.0.0:${PORT}`);
    console.log(`Health endpoint: http://0.0.0.0:${PORT}/health`);
    console.log(`Bus arrival: http://0.0.0.0:${PORT}/api/BusArrival?BusStopCode=83139`);
    console.log(`Traffic incidents: http://0.0.0.0:${PORT}/api/TrafficIncidents`);
    console.log(`Train alerts: http://0.0.0.0:${PORT}/api/TrainServiceAlerts`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
