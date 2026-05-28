import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import { initDb } from './db';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(authMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL, credentials: true },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token as string;
  if (!token) return next(new Error('Authentication error'));
  // token verification handled in auth middleware utils (omitted for brevity)
  next();
});

io.on('connection', (socket) => {
  console.log('User connected', socket.id);
  socket.on('joinRoom', (roomId: string) => {
    socket.join(roomId);
  });
  socket.on('sendMessage', (data) => {
    const { roomId, content, senderId } = data;
    // Persist message to DB (omitted) then emit to room
    io.to(roomId).emit('newMessage', { roomId, content, senderId, createdAt: new Date() });
  });
});

const PORT = process.env.PORT || 5000;
initDb()
  .then(() => {
    httpServer.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => console.error('Failed to init DB', err));
