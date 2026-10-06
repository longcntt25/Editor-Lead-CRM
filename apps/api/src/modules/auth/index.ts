import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { loginSchema, registerSchema, DEFAULT_PIPELINE_STAGES, User } from '@editor-crm/shared';
import { AppContext } from '../../types';
import { generateId, generateToken, hashPassword, verifyPassword } from '../../utils/crypto';
import { authMiddleware } from '../../middleware/auth';

const authApp = new Hono<AppContext>();

// 1. Register
authApp.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password, fullName, workspaceName } = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);

  // Check existing user
  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email.toLowerCase())
    .first();

  if (existing) {
    return c.json({ error: 'Email này đã được sử dụng' }, 400);
  }

  const userId = generateId();
  const passwordHash = await hashPassword(password);

  // Batch insert user, workspace, member, default pipeline, and stages
  const userWorkspaceName = workspaceName || `${fullName}'s Workspace`;
  const workspaceId = generateId();
  const workspaceSlug = `${email.split('@')[0]}-${Math.random().toString(36).substring(2, 6)}`;
  const pipelineId = generateId();

  const statements: D1PreparedStatement[] = [
    // Insert User
    c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(userId, email.toLowerCase(), passwordHash, fullName, now, now),

    // Insert Default Workspace
    c.env.DB.prepare(
      `INSERT INTO workspaces (id, name, slug, owner_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(workspaceId, userWorkspaceName, workspaceSlug, userId, now),

    // Insert Workspace Member as OWNER
    c.env.DB.prepare(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
       VALUES (?, ?, ?, 'OWNER', ?)`
    ).bind(generateId(), workspaceId, userId, now),

    // Insert Default Pipeline
    c.env.DB.prepare(
      `INSERT INTO pipelines (id, workspace_id, name, is_default, created_at)
       VALUES (?, ?, 'Video Editor Sales Pipeline', 1, ?)`
    ).bind(pipelineId, workspaceId, now),
  ];

  // Insert Default Pipeline Stages
  DEFAULT_PIPELINE_STAGES.forEach((stage) => {
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, color, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), pipelineId, stage.name, stage.order, stage.color, now)
    );
  });

  // Execute all in batch transaction
  await c.env.DB.batch(statements);

  // Create Session
  const sessionToken = generateToken();
  const expiresAt = now + 30 * 24 * 3600; // 30 days
  await c.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(generateId(), userId, sessionToken, expiresAt, now);

  return c.json({
    message: 'Đăng ký thành công',
    token: sessionToken,
    user: {
      id: userId,
      email: email.toLowerCase(),
      fullName,
      createdAt: now,
      updatedAt: now,
    },
    defaultWorkspaceId: workspaceId,
  });
});

// 2. Login
authApp.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);

  const userRecord = await c.env.DB.prepare(
    'SELECT * FROM users WHERE email = ?'
  )
    .bind(email.toLowerCase())
    .first<any>();

  if (!userRecord) {
    return c.json({ error: 'Email hoặc mật khẩu không chính xác' }, 401);
  }

  const isValid = await verifyPassword(password, userRecord.password_hash);
  if (!isValid) {
    return c.json({ error: 'Email hoặc mật khẩu không chính xác' }, 401);
  }

  // Generate session token
  const sessionToken = generateToken();
  const expiresAt = now + 30 * 24 * 3600; // 30 days
  await c.env.DB.prepare(
    `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(generateId(), userRecord.id, sessionToken, expiresAt, now);

  const user: User = {
    id: userRecord.id,
    email: userRecord.email,
    fullName: userRecord.full_name,
    avatarUrl: userRecord.avatar_url,
    createdAt: userRecord.created_at,
    updatedAt: userRecord.updated_at,
  };

  return c.json({
    message: 'Đăng nhập thành công',
    token: sessionToken,
    user,
  });
});

// 3. Me (Get profile & workspaces)
authApp.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');

  // Fetch workspaces user is part of
  const workspacesResult = await c.env.DB.prepare(
    `SELECT w.id, w.name, w.slug, w.owner_id, wm.role, wm.joined_at
     FROM workspace_members wm
     JOIN workspaces w ON wm.workspace_id = w.id
     WHERE wm.user_id = ?
     ORDER BY wm.joined_at ASC`
  )
    .bind(user.id)
    .all<any>();

  return c.json({
    user,
    workspaces: (workspacesResult.results || []).map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      ownerId: w.owner_id,
      role: w.role,
      joinedAt: w.joined_at,
    })),
  });
});

// 4. Logout
authApp.post('/logout', authMiddleware, async (c) => {
  const token = c.get('sessionToken');
  if (token) {
    await c.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  }
  return c.json({ message: 'Đăng xuất thành công' });
});

export { authApp };
