import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initSocket } from './socket/index.js';

const passenger = globalThis.PhusionPassenger;

if (passenger) {
  passenger.configure({ autoInstall: false });
}

const app = createApp();
const server = http.createServer(app);

initSocket(server);

const listenTarget = passenger ? 'passenger' : env.port;

server.listen(listenTarget, () => {
  if (passenger) {
    console.log('API running behind Phusion Passenger');
  } else {
    console.log(`API running at http://localhost:${env.port}`);
  }
  console.log('WebSocket ready on the same port');
  console.log(`CORS origin: ${env.corsOrigin}`);
});
