import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AppContext } from './types';
import { authApp } from './modules/auth';
import { workspaceApp } from './modules/workspace';
import { leadsApp } from './modules/leads';
import { notesApp } from './modules/notes';
import { pipelineApp } from './modules/pipeline';
import { templatesApp } from './modules/templates';
import { followupsApp } from './modules/followups';
import { dashboardApp } from './modules/dashboard';
import { analyticsApp } from './modules/analytics';

const app = new Hono<AppContext>();

// Enable CORS for Desktop client and Localhost
app.use(
  '*',
  cors({
    origin: (origin) => {
      // Allow tauri origins and localhost dev servers
      if (
        !origin ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('tauri://') ||
        origin.startsWith('https://tauri.localhost')
      ) {
        return origin || '*';
      }
      return '*';
    },
    allowHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
    credentials: true,
  })
);

// Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled Server Error:', err);
  return c.json(
    {
      error: err.message || 'Lỗi máy chủ nội bộ',
    },
    500
  );
});

// Root info
app.get('/', (c) => {
  return c.json({
    name: 'Editor Lead CRM API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      leads: '/api/v1/leads',
      workspaces: '/api/v1/workspaces',
      pipeline: '/api/v1/pipelines',
      templates: '/api/v1/templates',
      followUps: '/api/v1/follow-ups',
      dashboard: '/api/v1/dashboard',
      analytics: '/api/v1/analytics',
    },
  });
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'editor-lead-crm-api',
  });
});

// API Routes V1
app.route('/api/v1/auth', authApp);
app.route('/api/v1/workspaces', workspaceApp);
app.route('/api/v1/leads', leadsApp);
app.route('/api/v1/notes', notesApp);
app.route('/api/v1/pipelines', pipelineApp);
app.route('/api/v1/templates', templatesApp);
app.route('/api/v1/follow-ups', followupsApp);
app.route('/api/v1/dashboard', dashboardApp);
app.route('/api/v1/analytics', analyticsApp);

export default app;
