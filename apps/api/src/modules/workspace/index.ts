import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { addMemberSchema, createWorkspaceSchema, DEFAULT_PIPELINE_STAGES, User } from '@editor-crm/shared';
import { AppContext } from '../../types';
import { authMiddleware, workspaceMiddleware } from '../../middleware/auth';
import { generateId } from '../../utils/crypto';

const workspaceApp = new Hono<AppContext>();

workspaceApp.use('*', authMiddleware);

// 1. List user's workspaces
workspaceApp.get('/', async (c) => {
  const user = c.get('user');

  const result = await c.env.DB.prepare(
    `SELECT w.id, w.name, w.slug, w.owner_id, wm.role, wm.joined_at
     FROM workspace_members wm
     JOIN workspaces w ON wm.workspace_id = w.id
     WHERE wm.user_id = ?
     ORDER BY wm.joined_at ASC`
  )
    .bind(user.id)
    .all<any>();

  return c.json({ workspaces: result.results || [] });
});

// 2. Create new workspace
workspaceApp.post('/', zValidator('json', createWorkspaceSchema), async (c) => {
  const user = c.get('user');
  const { name } = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);

  const workspaceId = generateId();
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 6)}`;
  const pipelineId = generateId();

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `INSERT INTO workspaces (id, name, slug, owner_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(workspaceId, name, slug, user.id, now),

    c.env.DB.prepare(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
       VALUES (?, ?, ?, 'OWNER', ?)`
    ).bind(generateId(), workspaceId, user.id, now),

    c.env.DB.prepare(
      `INSERT INTO pipelines (id, workspace_id, name, is_default, created_at)
       VALUES (?, ?, 'Video Editor Sales Pipeline', 1, ?)`
    ).bind(pipelineId, workspaceId, now),
  ];

  DEFAULT_PIPELINE_STAGES.forEach((stage) => {
    statements.push(
      c.env.DB.prepare(
        `INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, color, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(generateId(), pipelineId, stage.name, stage.order, stage.color, now)
    );
  });

  await c.env.DB.batch(statements);

  return c.json({
    message: 'Tạo workspace thành công',
    workspace: {
      id: workspaceId,
      name,
      slug,
      ownerId: user.id,
      role: 'OWNER',
      createdAt: now,
    },
  });
});

// 3. List members of a workspace
workspaceApp.get('/:workspaceId/members', workspaceMiddleware(), async (c) => {
  const workspaceId = c.req.param('workspaceId');

  const result = await c.env.DB.prepare(
    `SELECT wm.id, wm.workspace_id, wm.user_id, wm.role, wm.joined_at,
            u.email, u.full_name, u.avatar_url
     FROM workspace_members wm
     JOIN users u ON wm.user_id = u.id
     WHERE wm.workspace_id = ?
     ORDER BY wm.joined_at ASC`
  )
    .bind(workspaceId)
    .all<any>();

  return c.json({
    members: (result.results || []).map((m) => ({
      id: m.id,
      workspaceId: m.workspace_id,
      userId: m.user_id,
      role: m.role,
      joinedAt: m.joined_at,
      user: {
        id: m.user_id,
        email: m.email,
        fullName: m.full_name,
        avatarUrl: m.avatar_url,
      },
    })),
  });
});

// 4. Add member by email (OWNER only)
workspaceApp.post(
  '/:workspaceId/members',
  workspaceMiddleware('OWNER'),
  zValidator('json', addMemberSchema),
  async (c) => {
    const workspaceId = c.req.param('workspaceId');
    const { email, role } = c.req.valid('json');
    const now = Math.floor(Date.now() / 1000);

    const targetUser = await c.env.DB.prepare('SELECT id, email, full_name FROM users WHERE email = ?')
      .bind(email.toLowerCase())
      .first<any>();

    if (!targetUser) {
      return c.json({ error: 'Không tìm thấy người dùng với email này. Hãy yêu cầu editor đăng ký tài khoản trước.' }, 404);
    }

    const existingMember = await c.env.DB.prepare(
      'SELECT id FROM workspace_members WHERE workspace_id = ? AND user_id = ?'
    )
      .bind(workspaceId, targetUser.id)
      .first();

    if (existingMember) {
      return c.json({ error: 'Người dùng này đã là thành viên trong workspace' }, 400);
    }

    const memberId = generateId();
    await c.env.DB.prepare(
      `INSERT INTO workspace_members (id, workspace_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(memberId, workspaceId, targetUser.id, role, now).run();

    return c.json({
      message: 'Thêm thành viên thành công',
      member: {
        id: memberId,
        workspaceId,
        userId: targetUser.id,
        role,
        joinedAt: now,
        user: {
          id: targetUser.id,
          email: targetUser.email,
          fullName: targetUser.full_name,
        },
      },
    });
  }
);

// 5. Remove member (OWNER only)
workspaceApp.delete('/:workspaceId/members/:userId', workspaceMiddleware('OWNER'), async (c) => {
  const workspaceId = c.req.param('workspaceId');
  const targetUserId = c.req.param('userId');

  const workspace = await c.env.DB.prepare('SELECT owner_id FROM workspaces WHERE id = ?')
    .bind(workspaceId)
    .first<any>();

  if (workspace && workspace.owner_id === targetUserId) {
    return c.json({ error: 'Không thể xóa Owner ra khỏi workspace' }, 400);
  }

  await c.env.DB.prepare(
    'DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?'
  )
    .bind(workspaceId, targetUserId)
    .run();

  return c.json({ message: 'Đã xóa thành viên khỏi workspace' });
});

export { workspaceApp };
