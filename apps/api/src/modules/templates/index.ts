import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createTemplateSchema, MessageTemplate } from '@editor-crm/shared';
import { AppContext } from '../../types';
import { authMiddleware, workspaceMiddleware } from '../../middleware/auth';
import { generateId } from '../../utils/crypto';

const templatesApp = new Hono<AppContext>();

templatesApp.use('*', authMiddleware);

// 1. List Templates
templatesApp.get('/', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;

  const result = await c.env.DB.prepare(
    `SELECT * FROM message_templates WHERE workspace_id = ? ORDER BY created_at DESC`
  )
    .bind(workspace.id)
    .all<any>();

  const templates: MessageTemplate[] = (result.results || []).map((t) => ({
    id: t.id,
    workspaceId: t.workspace_id,
    name: t.name,
    category: t.category,
    content: t.content,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  return c.json({ templates });
});

// 2. Create Template
templatesApp.post('/', workspaceMiddleware(), zValidator('json', createTemplateSchema), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const { name, category, content } = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);
  const id = generateId();

  await c.env.DB.prepare(
    `INSERT INTO message_templates (id, workspace_id, name, category, content, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, workspace.id, name, category || null, content, now, now)
    .run();

  return c.json({
    message: 'Tạo mẫu tin nhắn thành công',
    template: {
      id,
      workspaceId: workspace.id,
      name,
      category,
      content,
      createdAt: now,
      updatedAt: now,
    },
  });
});

// 3. Update Template
templatesApp.patch('/:id', workspaceMiddleware(), zValidator('json', createTemplateSchema), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const id = c.req.param('id');
  const { name, category, content } = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `UPDATE message_templates SET name = ?, category = ?, content = ?, updated_at = ?
     WHERE id = ? AND workspace_id = ?`
  )
    .bind(name, category || null, content, now, id, workspace.id)
    .run();

  return c.json({ message: 'Cập nhật mẫu tin nhắn thành công' });
});

// 4. Delete Template
templatesApp.delete('/:id', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM message_templates WHERE id = ? AND workspace_id = ?')
    .bind(id, workspace.id)
    .run();

  return c.json({ message: 'Đã xóa mẫu tin nhắn' });
});

export { templatesApp };
