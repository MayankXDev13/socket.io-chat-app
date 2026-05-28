import { Router } from 'express';
import authRouter from './auth';
import usersRouter from './users';
import roomsRouter from './rooms';
import messagesRouter from './messages';

const router = Router();
router.use('/auth', authRouter);
router.use('/users', usersRouter);
router.use('/rooms', roomsRouter);
router.use('/rooms', messagesRouter);

export default router;
