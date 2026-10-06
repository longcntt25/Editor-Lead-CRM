import { Context, Next } from 'hono';
import { AppContext } from '../types';
import { Role, User, Workspace } from '@editor-crm/shared';

export async function authMiddleware(c: Context<AppContext>, next: Next) {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Chưa đăng nhập hoặc thiếu token' }, 401);
  }

  const token = authHeader.substring(7);
  const now = Math.floor(Date.now() / 1000);

  // Query session from D1
  const sessionRecord = await c.env.DB.prepare(
    `SELECT s.*, u.id as user_id, u.email, u.full_name, u.avatar_url, u.created_at as user_created_at, u.updated_at as user_updated_at
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = ? AND s.expires_at > ?`
  )
    .bind(token, now)
    .first<any>();

  if (!sessionRecord) {
    return c.json({ error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ' }, 401);
  }

  const user: User = {
    id: sessionRecord.user_id,
    email: sessionRecord.email,
    fullName: sessionRecord.full_name,
    avatarUrl: sessionRecord.avatar_url,
    createdAt: sessionRecord.user_created_at,
    updatedAt: sessionRecord.user_updated_at,
  };

  c.set('user', user);
  c.set('sessionToken', token);

  await next();
}

export function workspaceMiddleware(requiredRole?: Role) {
  return async (c: Context<AppContext>, next: Next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Chưa xác thực người dùng' }, 401);
    }

    const workspaceId = c.req.header('X-Workspace-Id') || c.req.query('workspaceId');
    if (!workspaceId) {
      return c.json({ error: 'Vui lòng cung cấp workspace ID (X-Workspace-Id)' }, 400);
    }

    const memberRecord = await c.env.DB.prepare(
      `SELECT wm.role, w.id, w.name, w.slug, w.owner_id, w.created_at
       FROM workspace_members wm
       JOIN workspaces w ON wm.workspace_id = w.id
       WHERE wm.workspace_id = ? AND wm.user_id = ?`
    )
      .bind(workspaceId, user.id)
      .first<any>();

    if (!memberRecord) {
      return c.json({ error: 'Bạn không có quyền truy cập vào workspace này' }, 403);
    }

    const userRole = memberRecord.role as Role;
    if (requiredRole && requiredRole === 'OWNER' && userRole !== 'OWNER') {
      return c.json({ error: 'Chỉ Owner của Workspace mới có quyền thực hiện thao tác này' }, 403);
    }

    const workspace: Workspace = {
      id: memberRecord.id,
      name: memberRecord.name,
      slug: memberRecord.slug,
      ownerId: memberRecord.owner_id,
      createdAt: memberRecord.created_at,
    };

    c.set('currentWorkspace', workspace);
    c.set('userRole', userRole);

    await next();
  };
}
