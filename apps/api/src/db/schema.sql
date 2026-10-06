-- ==========================================
-- EDITOR LEAD CRM - D1 DATABASE SCHEMA V1
-- ==========================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 2. Sessions (Token based auth)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- 3. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);

-- 4. Workspace Members (Multi-user per workspace)
CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('OWNER', 'EDITOR')),
  joined_at INTEGER NOT NULL,
  UNIQUE(workspace_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON workspace_members(user_id);

-- 5. Pipelines & Stages (Customizable Kanban)
CREATE TABLE IF NOT EXISTS pipelines (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id TEXT PRIMARY KEY,
  pipeline_id TEXT NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stages_pipeline ON pipeline_stages(pipeline_id, stage_order);

-- 6. Leads (Core entity)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  pipeline_stage_id TEXT NOT NULL REFERENCES pipeline_stages(id),
  platform TEXT NOT NULL DEFAULT 'INSTAGRAM',
  platform_user_id TEXT,
  username TEXT NOT NULL,
  display_name TEXT,
  profile_url TEXT,
  avatar_url TEXT,
  bio TEXT,
  website TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  category TEXT DEFAULT 'CREATOR',
  language TEXT DEFAULT 'vi',
  score_tier TEXT NOT NULL DEFAULT 'LOW' CHECK(score_tier IN ('HIGH', 'MEDIUM', 'LOW')),
  score_points INTEGER DEFAULT 0,
  last_contacted_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leads_workspace ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_assignee ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_username ON leads(workspace_id, username);

-- 7. Lead Notes
CREATE TABLE IF NOT EXISTS lead_notes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_lead ON lead_notes(lead_id);

-- 8. Lead Activities (Audit trail timeline)
CREATE TABLE IF NOT EXISTS lead_activities (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL,
  details_json TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON lead_activities(lead_id, created_at DESC);

-- 9. Message Templates (Outreach)
CREATE TABLE IF NOT EXISTS message_templates (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_templates_workspace ON message_templates(workspace_id);

-- 10. Follow-ups
CREATE TABLE IF NOT EXISTS follow_ups (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  assigned_user_id TEXT NOT NULL REFERENCES users(id),
  due_date INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'COMPLETED', 'SKIPPED')),
  note TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_followups_due ON follow_ups(workspace_id, status, due_date);
