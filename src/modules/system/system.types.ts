export interface SystemInfo {
  name: string;
  version: string;
  environment: string;
  phase: '0-foundation' | '1-auth-tenant-users';
  apiPrefix: string;
  capabilities: {
    auth: 'disabled' | 'jwt' | 'jwt-session';
    tenantContext: 'jwt-derived' | 'placeholder' | 'header-or-public' | 'jwt-and-public';
    dataAccess: 'interfaces-only' | 'in-memory-adapter' | 'supabase-adapter';
  };
  entrypoints: {
    root: string;
    api: string;
    health: string;
    readiness: string;
  };
}

export interface HealthReport {
  status: 'ok';
  timestamp: string;
  uptimeSeconds: number;
}

export interface ReadinessCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface ReadinessReport {
  status: 'ready';
  timestamp: string;
  checks: ReadinessCheck[];
}
