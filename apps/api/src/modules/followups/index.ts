import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createFollowUpSchema, FollowUp, updateFollowUpStatusSchema } from '@editor-crm/shared';
import { AppContext } from '../../types';
import { authMiddleware, workspaceMiddleware } from '../../middleware/auth';
import { generateId } from '../../utils/crypto';

const followupsApp = new Hono<AppContext>();

followupsApp.use('*', authMiddleware);

// 1. List Follow-ups
followupsApp.get('/', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const url = new URL(c.req.url);
  const status = url.searchParams.get('status') || 'PENDING';
  const assignedUserId = url.searchParams.get('assignedUserId');

  let query = `
    SELECT f.*,
           l.username as lead_username, l.display_name as lead_display_name,
           l.avatar_url as lead_avatar_url, l.profile_url as lead_profile_url
    FROM follow_ups f
    JOIN leads l ON f.lead_id = l.id
    WHERE f.workspace_id = ?
  `;
  const params: any[] = [workspace.id];

  if (status && status !== 'ALL') {
    query += ` AND f.status = ?`;
    params.push(status);
  }

  if (assignedUserId) {
    query += ` AND f.assigned_user_id = ?`;
    params.push(assignedUserId);
  }

  query += ` ORDER BY f.due_date ASC LIMIT 100`;

  const result = await c.env.DB.prepare(query).bind(...params).all<any>();

  const followUps: FollowUp[] = (result.results || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id,
    assignedUserId: row.assigned_user_id,
    dueDate: row.due_date,
    status: row.status,
    note: row.note,
    createdAt: row.created_at,
    lead: {
      id: row.lead_id,
      username: row.lead_username,
      displayName: row.lead_display_name,
      avatarUrl: row.lead_avatar_url,
      profileUrl: row.lead_profile_url,
    },
  }));

  return c.json({ followUps });
});

// 2. Create manual Follow-up
followupsApp.post('/', workspaceMiddleware(), zValidator('json', createFollowUpSchema), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const user = c.get('user');
  const body = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);
  const id = generateId();

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `INSERT INTO follow_ups (id, workspace_id, lead_id, assigned_user_id, due_date, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`
    ).bind(id, workspace.id, body.leadId, body.assignedUserId, body.dueDate, body.note || null, now),

    c.env.DB.prepare(
      `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, details_json, created_at)
       VALUES (?, ?, ?, 'FOLLOW_UP_SCHEDULED', ?, ?)`
    ).bind(
      generateId(),
      body.leadId,
      user.id,
      JSON.stringify({ dueDate: body.dueDate, note: body.note }),
      now
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({ message: 'Lên lịch follow-up thành công', followUpId: id });
});

// 3. Update Follow-up status (Completed / Skipped)
followupsApp.patch('/:id/status', workspaceMiddleware(), zValidator('json', updateFollowUpStatusSchema), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const id = c.req.param('id');
  const { status } = c.req.valid('json');

  await c.env.DB.prepare(
    `UPDATE follow_ups SET status = ? WHERE id = ? AND workspace_id = ?`
  )
    .bind(status, id, workspace.id)
    .run();

  return c.json({ message: 'Cập nhật trạng thái follow-up thành công' });
});

export { followupsApp };
