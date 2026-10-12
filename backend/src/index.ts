import dotenv from 'dotenv';
dotenv.config();

import { ApifyService } from './services/apify-service';
import { ZyndService } from './services/zynd-service';
import { SuperplaneService } from './services/superplane-service';
import { createApp } from './app';

const port = process.env.PORT || 3005;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((s) => s.trim()).filter(Boolean);

const app = createApp(
  {
    apify: new ApifyService(),
    zynd: new ZyndService(process.env.ZYND_API_KEY || ''),
    superplane: new SuperplaneService(process.env.SUPERPLANE_API_KEY || ''),
  },
  corsOrigins,
);

app.listen(port, () => {
  console.log(`[Server] Autonomous Gig-Hunter backend running at port ${port}`);
});

process.on('uncaughtException', (err) => {
  // Carrying on after an uncaught exception leaves the process in an unknown state; let the supervisor restart it.
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
