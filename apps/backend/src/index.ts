import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { setupSocketIO } from './socket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// API routes
app.use('/api', routes);

// Health check
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'ChatVault API running' });
});

const server = http.createServer(app);
setupSocketIO(server);

server.listen(PORT, () => {
  console.log(`🚀 ChatVault server running on http://localhost:${PORT}`);
});
