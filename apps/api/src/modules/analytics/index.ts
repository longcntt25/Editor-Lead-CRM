import { Hono } from 'hono';
import { Workspace } from '@editor-crm/shared';
import { AppContext } from '../../types';
import { authMiddleware, workspaceMiddleware } from '../../middleware/auth';

const analyticsApp = new Hono<AppContext>();

analyticsApp.use('*', authMiddleware);

// GET /api/v1/analytics/overview
analyticsApp.get('/overview', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;

  // 1. Overall Totals
  const totals = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total_leads,
      SUM(CASE WHEN last_contacted_at IS NOT NULL THEN 1 ELSE 0 END) as contacted_leads,
      SUM(CASE WHEN score_tier IN ('HIGH', 'MEDIUM') THEN 1 ELSE 0 END) as qualified_leads
     FROM leads WHERE workspace_id = ?`
  )
    .bind(workspace.id)
    .first<any>();

  // Clients Won count
  const wonResult = await c.env.DB.prepare(
    `SELECT COUNT(*) as won_count
     FROM leads l
     JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
     WHERE l.workspace_id = ? AND LOWER(ps.name) IN ('client', 'won')`
  )
    .bind(workspace.id)
    .first<{ won_count: number }>();

  const totalLeads = totals?.total_leads || 0;
  const contactedLeads = totals?.contacted_leads || 0;
  const clientsWon = wonResult?.won_count || 0;
  const conversionRate = totalLeads > 0 ? Math.round((clientsWon / totalLeads) * 100) : 0;

  // 2. Metrics by Editor
  const editorStats = await c.env.DB.prepare(
    `SELECT
      u.id as editor_id,
      u.full_name as editor_name,
      COUNT(l.id) as total_assigned,
      SUM(CASE WHEN l.last_contacted_at IS NOT NULL THEN 1 ELSE 0 END) as contacted_count,
      SUM(CASE WHEN LOWER(ps.name) IN ('client', 'won') THEN 1 ELSE 0 END) as clients_count
     FROM workspace_members wm
     JOIN users u ON wm.user_id = u.id
     LEFT JOIN leads l ON l.assigned_user_id = u.id AND l.workspace_id = ?
     LEFT JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
     WHERE wm.workspace_id = ?
     GROUP BY u.id, u.full_name`
  )
    .bind(workspace.id, workspace.id)
    .all<any>();

  // 3. Metrics by Category
  const categoryStats = await c.env.DB.prepare(
    `SELECT
      category,
      COUNT(*) as total_leads,
      SUM(CASE WHEN last_contacted_at IS NOT NULL THEN 1 ELSE 0 END) as contacted_leads,
      SUM(CASE WHEN LOWER(ps.name) IN ('client', 'won') THEN 1 ELSE 0 END) as won_leads
     FROM leads l
     LEFT JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
     WHERE l.workspace_id = ?
     GROUP BY category
     ORDER BY total_leads DESC`
  )
    .bind(workspace.id)
    .all<any>();

  return c.json({
    overview: {
      totalLeads,
      contactedLeads,
      qualifiedLeads: totals?.qualified_leads || 0,
      clientsWon,
      conversionRate,
    },
    byEditor: (editorStats.results || []).map((e) => ({
      editorId: e.editor_id,
      name: e.editor_name,
      totalAssigned: e.total_assigned || 0,
      contacted: e.contacted_count || 0,
      clientsWon: e.clients_count || 0,
    })),
    byCategory: (categoryStats.results || []).map((cat) => ({
      category: cat.category || 'OTHER',
      totalLeads: cat.total_leads || 0,
      contacted: cat.contacted_leads || 0,
      clientsWon: cat.won_leads || 0,
    })),
  });
});

export { analyticsApp };
