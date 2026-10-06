import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  calculateScoreTier,
  createLeadSchema,
  updateLeadSchema,
  DEFAULT_SCORING_WEIGHTS,
  Lead,
  User,
  Workspace,
  ScoreTier,
} from '@editor-crm/shared';
import { AppContext } from '../../types';
import { authMiddleware, workspaceMiddleware } from '../../middleware/auth';
import { generateId } from '../../utils/crypto';

const leadsApp = new Hono<AppContext>();

leadsApp.use('*', authMiddleware);

// Server-side Lead Scoring Engine
function calculateLeadScore(data: {
  category?: string | null;
  followerCount?: number;
  website?: string | null;
  bio?: string | null;
  language?: string | null;
}): { scorePoints: number; scoreTier: ScoreTier } {
  let points = 0;
  const weights = DEFAULT_SCORING_WEIGHTS;

  // 1. Category match (High value targets for video editors)
  const highValueCategories = ['CREATOR', 'YOUTUBER', 'PODCAST', 'COACH', 'PERSONAL_BRAND'];
  if (data.category && highValueCategories.includes(data.category)) {
    points += weights.categoryMatch;
  } else if (data.category === 'AGENCY' || data.category === 'BRAND') {
    points += weights.categoryMatch - 5;
  }

  // 2. Follower sweet-spot (5k - 250k is ideal for video editing outreach)
  const followers = data.followerCount || 0;
  if (followers >= 5000 && followers <= 250000) {
    points += weights.followerRangeMatch;
  } else if (followers > 250000) {
    points += weights.followerRangeMatch - 5;
  } else if (followers >= 1000) {
    points += weights.followerRangeMatch - 10;
  }

  // 3. Has website / bio link (shows commercial intent)
  if (data.website && data.website.trim().length > 3) {
    points += weights.hasWebsite;
  }

  // 4. Bio completeness / activity
  if (data.bio && data.bio.trim().length > 20) {
    points += weights.activeProfile;
  }

  // 5. Language target match
  if (data.language === 'vi' || data.language === 'en') {
    points += weights.languageMatch;
  }

  const scoreTier = calculateScoreTier(points);
  return { scorePoints: points, scoreTier };
}

// 1. List Leads
leadsApp.get('/', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const url = new URL(c.req.url);
  const search = url.searchParams.get('q');
  const stageId = url.searchParams.get('stageId');
  const category = url.searchParams.get('category');
  const scoreTier = url.searchParams.get('scoreTier');
  const assignedUserId = url.searchParams.get('assignedUserId');

  let query = `
    SELECT l.*,
           u.full_name as assigned_user_name, u.email as assigned_user_email,
           ps.name as stage_name, ps.color as stage_color, ps.stage_order
    FROM leads l
    LEFT JOIN users u ON l.assigned_user_id = u.id
    LEFT JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
    WHERE l.workspace_id = ?
  `;
  const params: any[] = [workspace.id];

  if (search) {
    query += ` AND (l.username LIKE ? OR l.display_name LIKE ? OR l.bio LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (stageId) {
    query += ` AND l.pipeline_stage_id = ?`;
    params.push(stageId);
  }

  if (category) {
    query += ` AND l.category = ?`;
    params.push(category);
  }

  if (scoreTier) {
    query += ` AND l.score_tier = ?`;
    params.push(scoreTier);
  }

  if (assignedUserId) {
    query += ` AND l.assigned_user_id = ?`;
    params.push(assignedUserId);
  }

  query += ` ORDER BY l.created_at DESC LIMIT 200`;

  const result = await c.env.DB.prepare(query).bind(...params).all<any>();

  const leads: Lead[] = (result.results || []).map((row) => ({
    id: row.id,
    workspaceId: row.workspace_id,
    assignedUserId: row.assigned_user_id,
    pipelineStageId: row.pipeline_stage_id,
    platform: row.platform,
    platformUserId: row.platform_user_id,
    username: row.username,
    displayName: row.display_name,
    profileUrl: row.profile_url,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    website: row.website,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    category: row.category,
    language: row.language,
    scoreTier: row.score_tier,
    scorePoints: row.score_points,
    lastContactedAt: row.last_contacted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    assignedUser: row.assigned_user_id
      ? {
          id: row.assigned_user_id,
          fullName: row.assigned_user_name,
          email: row.assigned_user_email,
        }
      : null,
    stage: row.pipeline_stage_id
      ? {
          id: row.pipeline_stage_id,
          pipelineId: '',
          name: row.stage_name,
          stageOrder: row.stage_order,
          color: row.stage_color,
        }
      : null,
  }));

  return c.json({ leads });
});

// 2. Create Lead
leadsApp.post('/', workspaceMiddleware(), zValidator('json', createLeadSchema), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const user = c.get('user');
  const body = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);

  // If no pipeline stage provided, find first stage of default pipeline
  let stageId = body.pipelineStageId;
  if (!stageId) {
    const firstStage = await c.env.DB.prepare(
      `SELECT ps.id FROM pipeline_stages ps
       JOIN pipelines p ON ps.pipeline_id = p.id
       WHERE p.workspace_id = ?
       ORDER BY ps.stage_order ASC LIMIT 1`
    )
      .bind(workspace.id)
      .first<{ id: string }>();

    stageId = firstStage?.id;
    if (!stageId) {
      return c.json({ error: 'Workspace chưa có pipeline stage nào' }, 400);
    }
  }

  // Calculate score on server
  const { scorePoints, scoreTier } = calculateLeadScore(body);
  const leadId = generateId();
  const cleanUsername = body.username.replace(/^@/, '').trim();
  const profileUrl = body.profileUrl || `https://instagram.com/${cleanUsername}`;

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `INSERT INTO leads (
        id, workspace_id, assigned_user_id, pipeline_stage_id,
        platform, username, display_name, profile_url, avatar_url,
        bio, website, follower_count, following_count, category,
        language, score_tier, score_points, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      leadId,
      workspace.id,
      body.assignedUserId || null,
      stageId,
      'INSTAGRAM',
      cleanUsername,
      body.displayName || cleanUsername,
      profileUrl,
      body.avatarUrl || null,
      body.bio || null,
      body.website || null,
      body.followerCount || 0,
      body.followingCount || 0,
      body.category,
      body.language || 'vi',
      scoreTier,
      scorePoints,
      now,
      now
    ),

    // Log LEAD_CREATED activity
    c.env.DB.prepare(
      `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, details_json, created_at)
       VALUES (?, ?, ?, 'LEAD_CREATED', ?, ?)`
    ).bind(
      generateId(),
      leadId,
      user.id,
      JSON.stringify({ username: cleanUsername, scoreTier, scorePoints }),
      now
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({
    message: 'Tạo lead thành công',
    leadId,
  });
});

// 3. Get single Lead
leadsApp.get('/:id', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const id = c.req.param('id');

  const lead = await c.env.DB.prepare(
    `SELECT l.*,
            u.full_name as assigned_user_name, u.email as assigned_user_email,
            ps.name as stage_name, ps.color as stage_color, ps.stage_order
     FROM leads l
     LEFT JOIN users u ON l.assigned_user_id = u.id
     LEFT JOIN pipeline_stages ps ON l.pipeline_stage_id = ps.id
     WHERE l.id = ? AND l.workspace_id = ?`
  )
    .bind(id, workspace.id)
    .first<any>();

  if (!lead) {
    return c.json({ error: 'Không tìm thấy lead này' }, 404);
  }

  return c.json({
    lead: {
      ...lead,
      assignedUser: lead.assigned_user_id
        ? {
            id: lead.assigned_user_id,
            fullName: lead.assigned_user_name,
            email: lead.assigned_user_email,
          }
        : null,
      stage: lead.pipeline_stage_id
        ? {
            id: lead.pipeline_stage_id,
            name: lead.stage_name,
            stageOrder: lead.stage_order,
            color: lead.stage_color,
          }
        : null,
    },
  });
});

// 4. Update Lead
leadsApp.patch('/:id', workspaceMiddleware(), zValidator('json', updateLeadSchema), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const user = c.get('user');
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const now = Math.floor(Date.now() / 1000);

  const existing = await c.env.DB.prepare(
    'SELECT * FROM leads WHERE id = ? AND workspace_id = ?'
  )
    .bind(id, workspace.id)
    .first<any>();

  if (!existing) {
    return c.json({ error: 'Không tìm thấy lead' }, 404);
  }

  const updatedCategory = body.category !== undefined ? body.category : existing.category;
  const updatedFollowers = body.followerCount !== undefined ? body.followerCount : existing.follower_count;
  const updatedWebsite = body.website !== undefined ? body.website : existing.website;
  const updatedBio = body.bio !== undefined ? body.bio : existing.bio;

  const { scorePoints, scoreTier } = calculateLeadScore({
    category: updatedCategory,
    followerCount: updatedFollowers,
    website: updatedWebsite,
    bio: updatedBio,
    language: body.language || existing.language,
  });

  await c.env.DB.prepare(
    `UPDATE leads SET
      display_name = COALESCE(?, display_name),
      bio = COALESCE(?, bio),
      website = COALESCE(?, website),
      follower_count = COALESCE(?, follower_count),
      following_count = COALESCE(?, following_count),
      category = COALESCE(?, category),
      language = COALESCE(?, language),
      score_tier = ?,
      score_points = ?,
      updated_at = ?
     WHERE id = ? AND workspace_id = ?`
  )
    .bind(
      body.displayName,
      body.bio,
      body.website,
      body.followerCount,
      body.followingCount,
      body.category,
      body.language,
      scoreTier,
      scorePoints,
      now,
      id,
      workspace.id
    )
    .run();

  return c.json({ message: 'Cập nhật lead thành công' });
});

// 5. Assign Lead
leadsApp.post('/:id/assign', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const user = c.get('user');
  const id = c.req.param('id');
  const { assignedUserId } = await c.req.json<{ assignedUserId: string | null }>();
  const now = Math.floor(Date.now() / 1000);

  let targetUserName = 'Chưa phân công';
  if (assignedUserId) {
    const member = await c.env.DB.prepare(
      `SELECT u.full_name FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = ? AND wm.user_id = ?`
    )
      .bind(workspace.id, assignedUserId)
      .first<{ full_name: string }>();

    if (!member) {
      return c.json({ error: 'Người dùng được chỉ định không thuộc workspace này' }, 400);
    }
    targetUserName = member.full_name;
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `UPDATE leads SET assigned_user_id = ?, updated_at = ? WHERE id = ? AND workspace_id = ?`
    ).bind(assignedUserId, now, id, workspace.id),

    c.env.DB.prepare(
      `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, details_json, created_at)
       VALUES (?, ?, ?, 'ASSIGNED', ?, ?)`
    ).bind(
      generateId(),
      id,
      user.id,
      JSON.stringify({ assignedUserId, assignedUserName: targetUserName }),
      now
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({ message: 'Phân công lead thành công', assignedUserId });
});

// 6. Change Stage (Kanban Drag and Drop)
leadsApp.post('/:id/stage', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const user = c.get('user');
  const id = c.req.param('id');
  const { stageId } = await c.req.json<{ stageId: string }>();
  const now = Math.floor(Date.now() / 1000);

  const stage = await c.env.DB.prepare(
    `SELECT ps.id, ps.name FROM pipeline_stages ps
     JOIN pipelines p ON ps.pipeline_id = p.id
     WHERE ps.id = ? AND p.workspace_id = ?`
  )
    .bind(stageId, workspace.id)
    .first<{ id: string; name: string }>();

  if (!stage) {
    return c.json({ error: 'Stage không tồn tại trong workspace này' }, 400);
  }

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `UPDATE leads SET pipeline_stage_id = ?, updated_at = ? WHERE id = ? AND workspace_id = ?`
    ).bind(stageId, now, id, workspace.id),

    c.env.DB.prepare(
      `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, details_json, created_at)
       VALUES (?, ?, ?, 'STAGE_CHANGED', ?, ?)`
    ).bind(
      generateId(),
      id,
      user.id,
      JSON.stringify({ stageId, stageName: stage.name }),
      now
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({ message: 'Di chuyển stage thành công', stageId, stageName: stage.name });
});

// 7. Mark Contacted & Auto schedule follow-up
leadsApp.post('/:id/contacted', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const user = c.get('user');
  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);
  const followUpDays = 3; // Standard 3-day follow-up cadence
  const dueDate = now + followUpDays * 24 * 3600;

  // Move lead to 'Contacted' stage if exists
  const contactedStage = await c.env.DB.prepare(
    `SELECT ps.id FROM pipeline_stages ps
     JOIN pipelines p ON ps.pipeline_id = p.id
     WHERE p.workspace_id = ? AND LOWER(ps.name) = 'contacted'
     LIMIT 1`
  )
    .bind(workspace.id)
    .first<{ id: string }>();

  const statements: D1PreparedStatement[] = [
    c.env.DB.prepare(
      `UPDATE leads SET
        last_contacted_at = ?,
        pipeline_stage_id = COALESCE(?, pipeline_stage_id),
        updated_at = ?
       WHERE id = ? AND workspace_id = ?`
    ).bind(now, contactedStage?.id || null, now, id, workspace.id),

    // Log Activity
    c.env.DB.prepare(
      `INSERT INTO lead_activities (id, lead_id, user_id, activity_type, details_json, created_at)
       VALUES (?, ?, ?, 'CONTACTED', ?, ?)`
    ).bind(generateId(), id, user.id, JSON.stringify({ contactedAt: now }), now),

    // Auto schedule 3-day Follow-up
    c.env.DB.prepare(
      `INSERT INTO follow_ups (id, workspace_id, lead_id, assigned_user_id, due_date, status, note, created_at)
       VALUES (?, ?, ?, ?, ?, 'PENDING', ?, ?)`
    ).bind(
      generateId(),
      workspace.id,
      id,
      user.id,
      dueDate,
      'Follow-up lần 1 (tự động lên lịch 3 ngày sau khi liên hệ)',
      now
    ),
  ];

  await c.env.DB.batch(statements);

  return c.json({
    message: 'Đã đánh dấu liên hệ thành công và lên lịch follow-up sau 3 ngày',
    dueDate,
  });
});

// 8. Delete Lead
leadsApp.delete('/:id', workspaceMiddleware(), async (c) => {
  const workspace = c.get('currentWorkspace')!;
  const id = c.req.param('id');

  await c.env.DB.prepare('DELETE FROM leads WHERE id = ? AND workspace_id = ?')
    .bind(id, workspace.id)
    .run();

  return c.json({ message: 'Đã xóa lead' });
});

export { leadsApp };
