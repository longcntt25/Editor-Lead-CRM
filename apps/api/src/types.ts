import { Role, User, Workspace } from '@editor-crm/shared';

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export interface AuthContextVariables {
  user: User;
  sessionToken: string;
  currentWorkspace?: Workspace;
  userRole?: Role;
}

export type AppContext = {
  Bindings: Env;
  Variables: AuthContextVariables;
};
