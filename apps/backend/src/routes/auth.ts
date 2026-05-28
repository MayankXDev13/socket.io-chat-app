import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../db';
import { users, verificationTokens } from '../db/schema';
import { generateTokenPair, verifyRefreshToken } from '../lib/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '@repo/shared';

const router = Router();

// POST /register
router.post('/register', validate(registerSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, password } = req.body;

    const existingUser = await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, email), eq(u.username, username)),
    });

    if (existingUser) {
      res.status(409).json({
        message: existingUser.email === email ? 'Email already in use.' : 'Username already taken.',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(users).values({ email, username, passwordHash }).returning();

    const token = uuidv4();
    await db.insert(verificationTokens).values({
      userId: user.id,
      token,
      type: 'email_verify',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationEmail(email, token);

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /login
router.post('/login', validate(loginSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: 'Please verify your email before logging in.' });
      return;
    }

    const tokens = generateTokenPair(user.id);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isVerified: user.isVerified,
        createdAt: user.createdAt.toISOString(),
      },
      ...tokens,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /verify-email
router.post('/verify-email', validate(verifyEmailSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, 'email_verify'),
        gt(verificationTokens.expiresAt, new Date())
      ),
    });

    if (!record) {
      res.status(400).json({ message: 'Invalid or expired verification token.' });
      return;
    }

    await db.update(users).set({ isVerified: true }).where(eq(users.id, record.userId));
    await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));

    res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });

    if (user) {
      const token = uuidv4();
      await db.insert(verificationTokens).values({
        userId: user.id,
        token,
        type: 'password_reset',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });
      await sendPasswordResetEmail(email, token);
    }

    res.json({ message: 'If an account with that email exists, we sent a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /reset-password
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    const record = await db.query.verificationTokens.findFirst({
      where: and(
        eq(verificationTokens.token, token),
        eq(verificationTokens.type, 'password_reset'),
        gt(verificationTokens.expiresAt, new Date())
      ),
    });

    if (!record) {
      res.status(400).json({ message: 'Invalid or expired reset token.' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
    await db.delete(verificationTokens).where(eq(verificationTokens.id, record.id));

    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /refresh
router.post('/refresh', validate(refreshTokenSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);
    const tokens = generateTokenPair(payload.userId);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token.' });
  }
});

// GET /me
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await db.query.users.findFirst({ where: eq(users.id, req.user!.id) });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      isVerified: user.isVerified,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
