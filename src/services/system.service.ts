import type { AppEnv } from '../config/env.js';
import type { HealthReport, ReadinessCheck, ReadinessReport, SystemInfo } from '../modules/system/system.types.js';
import type { RuntimeRepository } from '../repositories/runtime.repository.js';

export class SystemService {
  public constructor(
    private readonly env: AppEnv,
    private readonly runtimeRepository: RuntimeRepository,
  ) {}

  public getRootInfo(): SystemInfo {
    return this.buildSystemInfo();
  }

  public getApiInfo(): SystemInfo {
    return this.buildSystemInfo();
  }

  public getHealthReport(): HealthReport {
    const snapshot = this.runtimeRepository.getSnapshot();

    return {
      status: 'ok',
      timestamp: snapshot.timestamp,
      uptimeSeconds: snapshot.uptimeSeconds,
    };
  }

  public getReadinessReport(): ReadinessReport {
    const snapshot = this.runtimeRepository.getSnapshot();
    const checks: ReadinessCheck[] = [
      {
        name: 'config',
        status: 'pass',
        detail: 'Environment configuration loaded and validated.',
      },
      {
        name: 'auth',
        status: this.env.AUTH.mode === 'disabled' ? 'warn' : 'pass',
        detail:
          this.env.AUTH.mode === 'disabled'
            ? 'JWT authentication is implemented but disabled by environment configuration.'
            : `JWT authentication is active in ${this.env.AUTH.mode} mode.`,
      },
      {
        name: 'tenant',
        status: this.env.AUTH.mode === 'disabled' ? 'warn' : 'pass',
        detail:
          this.env.AUTH.mode === 'disabled'
            ? 'Tenant context still depends on placeholder hints until authenticated requests are enabled.'
            : 'Tenant context can be derived from authenticated JWT claims.',
      },
      {
        name: 'data-access',
        status: this.env.REPOSITORY.driver === 'supabase' ? 'pass' : 'warn',
        detail:
          this.env.REPOSITORY.driver === 'supabase'
            ? 'Supabase persistence adapter is active.'
            : 'In-memory persistence adapter is active.',
      },
    ];

    return {
      status: 'ready',
      timestamp: snapshot.timestamp,
      checks,
    };
  }

  private buildSystemInfo(): SystemInfo {
    return {
      name: 'storepage-back',
      version: '0.1.0',
      environment: this.env.NODE_ENV,
      phase: '1-auth-tenant-users',
      apiPrefix: this.env.API_PREFIX,
      capabilities: {
        auth: this.env.AUTH.mode === 'disabled' ? 'disabled' : 'jwt-session',
        tenantContext: this.env.AUTH.mode === 'disabled' ? 'header-or-public' : 'jwt-and-public',
        dataAccess: this.env.REPOSITORY.driver === 'supabase' ? 'supabase-adapter' : 'in-memory-adapter',
      },
      entrypoints: {
        root: '/',
        api: this.env.API_PREFIX,
        health: '/health',
        readiness: '/readyz',
      },
    };
  }
}
