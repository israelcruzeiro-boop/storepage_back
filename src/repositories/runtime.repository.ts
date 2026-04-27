export interface RuntimeSnapshot {
  timestamp: string;
  uptimeSeconds: number;
}

export class RuntimeRepository {
  public getSnapshot(): RuntimeSnapshot {
    return {
      timestamp: new Date().toISOString(),
      uptimeSeconds: Number(process.uptime().toFixed(3)),
    };
  }
}
