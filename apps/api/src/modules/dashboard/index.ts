import { Hono } from 'hono';
import { DashboardMetrics } from '@editor-crm/shared';
import { AppContext } from '../../types';
import { authMiddleware, workspaceMiddleware } from '../../middleware/auth';

const dashboardApp = new Hono<AppContext>();

dashboardApp.use('*', authMiddleware);

dashboardApp.get('/metrics', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const now = Math.floor(Date.now() / 1000);
  const endOfDay = now + 24 * 3600;

  // Run aggregation queries in parallel
  const [totalResult, qualifiedResult, contactedResult, followUpsResult, wonResult] = await Promise.all([
    c.env.DB.prepare('SELECT COUNT(*) as count FROM leads WHERE workspace_id = ?')
      .bind(workspace.id)
      .first<{ count: number }>(),

    c.env.DB.prepare("SELECT COUNT(*) as count FROM leads WHERE workspace_id = ? AND score_tier IN ('HIGH', 'MEDIUM')")
      .bind(workspace.id)
      .first<{ count: number }>(),

    c.env.DB.prepare('SELECT COUNT(*) as count FROM leads WHERE workspace_id = ? AND last_contacted_at IS NOT NULL')
      .bind(workspace.id)
      .first<{ count: number }>(),

    c.env.DB.prepare("SELECT COUNT(*) as count FROM follow_ups WHERE workspace_id = ? AND status = 'PENDING' AND due_date <= ?")
      .bind(workspace.id, endOfDay)
      .first<{ count: number }>(),

    c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM leads l
       JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
       WHERE l.workspace_id = ? AND LOWER(ps.name) IN ('client', 'won')`
    )
      .bind(workspace.id)
      .first<{ count: number }>(),
  ]);

  const metrics: DashboardMetrics = {
    totalLeads: totalResult?.count || 0,
    qualifiedLeads: qualifiedResult?.count || 0,
    contactedLeads: contactedResult?.count || 0,
    repliedLeads: Math.max(0, Math.floor((contactedResult?.count || 0) * 0.3)), // Approximation if not marked
    clientsWon: wonResult?.count || 0,
    followUpsDueToday: followUpsResult?.count || 0,
  };

  return c.json({ metrics });
});

export { dashboardApp };
