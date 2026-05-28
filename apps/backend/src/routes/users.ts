import { Router, Request, Response } from 'express';
import { ilike, ne, and, eq } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../db/schema';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { searchUsersSchema } from '@repo/shared';

const router = Router();
router.use(authenticate);

// GET /search?q=
router.get('/search', validate(searchUsersSchema, 'query'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q: string };
    const results = await db
      .select({ id: users.id, username: users.username, email: users.email })
      .from(users)
      .where(and(ilike(users.username, `%${q}%`), ne(users.id, req.user!.id)))
      .limit(20);
    res.json(results);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.params.id),
      columns: { id: true, username: true, email: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }
    res.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
