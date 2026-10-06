import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createNoteSchema } from '@editor-crm/shared';
import { AppContext } from '../../types';
import { authMiddleware, workspaceMiddleware } from '../../middleware/auth';
import { generateId } from '../../utils/crypto';

const notesApp = new Hono<AppContext>();

notesApp.use('*', authMiddleware);

// 1. Get Notes for a Lead
notesApp.get('/:leadId/notes', workspaceMiddleware(), async (c) => {
  const leadId = c.req.param('leadId');

  const result = await c.env.DB.prepare(
    `SELECT ln.*, u.full_name as author_name, u.avatar_url as author_avatar
     FROM lead_notes ln
     JOIN users u ON ln.user_id = u.id
     WHERE ln.lead_id = ?
     ORDER BY ln.created_at DESC`
  )
    .bind(leadId)
    .all<any>();

  return c.json({
    notes: (result.results || []).map((n) => ({
      id: n.id,
      leadId: n.lead_id,
      userId: n.user_id,
      content: n.content,
      createdAt: n.created_at,
      user: {
        id: n.user_id,
        fullName: n.author_name,
        avatarUrl: n.author_avatar,
      },
    })),
  });
});

// 2. Add Note to Lead
notesApp.post('/:leadId/notes', workspaceMiddleware(), zValidator('json', createNoteSchema), async (c) => {
  const leadId = c.req.param('leadId');
  const user = c.get('user');
  const { content } = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);

  const noteId = generateId();

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `INSERT INTO lead_notes (id, lead_id, user_id, content, created_at)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(noteId, leadId, user.id, content, now),

    c.env.DB.prepare(
      `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, details_json, created_at)
       VALUES (?, ?, ?, 'NOTE_ADDED', ?, ?)`
    ).bind(
      generateId(),
      leadId,
      user.id,
      JSON.stringify({ noteSnippet: content.slice(0, 80) }),
      now
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({
    message: 'Thêm ghi chú thành công',
    note: {
      id: noteId,
      leadId,
      userId: user.id,
      content,
      createdAt: now,
      user: {
        id: user.id,
        fullName: user.fullName,
      },
    },
  });
});

// 3. Get Activities Timeline for a Lead
notesApp.get('/:leadId/activities', workspaceMiddleware(), async (c) => {
  const leadId = c.req.param('leadId');

  const result = await c.env.DB.prepare(
    `SELECT la.*, u.full_name as user_name
     FROM lead_activities la
     LEFT JOIN users u ON la.user_id = u.id
     WHERE la.lead_id = ?
     ORDER BY la.created_at DESC`
  )
    .bind(leadId)
    .all<any>();

  return c.json({
    activities: (result.results || []).map((a) => ({
      id: a.id,
      leadId: a.lead_id,
      userId: a.user_id,
      activityType: a.activity_type,
      details: a.details_json ? JSON.parse(a.details_json) : {},
      createdAt: a.created_at,
      user: a.user_id
        ? {
            id: a.user_id,
            fullName: a.user_name,
          }
        : null,
    })),
  });
});

export { notesApp };
