import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { initSocket } from './socket/index.js';

const app = createApp();
const server = http.createServer(app);

initSocket(server);

server.listen(env.port, () => {
  console.log(`API running at http://localhost:${env.port}`);
  console.log(`WebSocket ready on the same port`);
  console.log(`CORS origin: ${env.corsOrigin}`);
});
