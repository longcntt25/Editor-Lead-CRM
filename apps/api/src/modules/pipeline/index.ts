import { Hono } from 'hono';
import { Pipeline, PipelineStage } from '@editor-crm/shared';
import { AppContext } from '../../types';
import { authMiddleware, workspaceMiddleware } from '../../middleware/auth';
import { generateId } from '../../utils/crypto';

const pipelineApp = new Hono<AppContext>();

pipelineApp.use('*', authMiddleware);

// 1. Get Pipeline & Stages
pipelineApp.get('/', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;

  const pipeline = await c.env.DB.prepare(
    `SELECT * FROM pipelines WHERE workspace_id = ? AND is_default = 1 LIMIT 1`
  )
    .bind(workspace.id)
    .first<any>();

  if (!pipeline) {
    return c.json({ error: 'Chưa có pipeline' }, 404);
  }

  const stagesResult = await c.env.DB.prepare(
    `SELECT * FROM pipeline_stages WHERE pipeline_id = ? ORDER BY stage_order ASC`
  )
    .bind(pipeline.id)
    .all<any>();

  const stages: PipelineStage[] = (stagesResult.results || []).map((s) => ({
    id: s.id,
    pipelineId: s.pipeline_id,
    name: s.name,
    stageOrder: s.stage_order,
    color: s.color || '#3b82f6',
  }));

  const fullPipeline: Pipeline = {
    id: pipeline.id,
    workspaceId: pipeline.workspace_id,
    name: pipeline.name,
    isDefault: Boolean(pipeline.is_default),
    stages,
  };

  return c.json({ pipeline: fullPipeline });
});

// 2. Add or Reorder Stages (OWNER only)
pipelineApp.post('/stages', workspaceMiddleware('OWNER'), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const { stages } = await c.req.json<{ stages: { id?: string; name: string; stageOrder: number; color?: string }[] }>();
  const now = Math.floor(Date.now() / 1000);

  const pipeline = await c.env.DB.prepare(
    `SELECT id FROM pipelines WHERE workspace_id = ? AND is_default = 1 LIMIT 1`
  )
    .bind(workspace.id)
    .first<{ id: string }>();

  if (!pipeline) {
    return c.json({ error: 'Pipeline không tồn tại' }, 404);
  }

  const statements: D1PreparedStatement[] = [];

  for (const s of stages) {
    if (s.id) {
      statements.push(
        c.env.DB.prepare(
          `UPDATE pipeline_stages SET name = ?, stage_order = ?, color = ? WHERE id = ? AND pipeline_id = ?`
        ).bind(s.name, s.stageOrder, s.color || '#3b82f6', s.id, pipeline.id)
      );
    } else {
      statements.push(
        c.env.DB.prepare(
          `INSERT INTO pipeline_stages (id, pipeline_id, name, stage_order, color, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(generateId(), pipeline.id, s.name, s.stageOrder, s.color || '#3b82f6', now)
      );
    }
  }

  if (statements.length > 0) {
    await c.env.DB.batch(statements);
  }

  return c.json({ message: 'Cập nhật pipeline stages thành công' });
});

export { pipelineApp };
