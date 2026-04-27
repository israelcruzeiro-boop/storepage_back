type QueryValue = string | number | boolean | null;

interface Filter {
  column: string;
  operator: 'eq' | 'is' | 'ilike' | 'in';
  value: QueryValue | readonly QueryValue[];
}

interface Order {
  column: string;
  ascending?: boolean;
}

interface SelectOptions {
  select: string;
  filters?: readonly Filter[];
  or?: string;
  order?: readonly Order[];
  range?: {
    offset: number;
    limit: number;
  };
  count?: boolean;
}

interface WriteOptions {
  select?: string;
  onConflict?: string;
}

export interface SelectResult<Row> {
  rows: Row[];
  total: number | null;
}

export class SupabaseRestError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'SupabaseRestError';
  }
}

export class SupabaseRestClient {
  private readonly restUrl: string;

  public constructor(
    supabaseUrl: string,
    private readonly serviceRoleKey: string,
    private readonly schema: string,
  ) {
    this.restUrl = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1`;
  }

  public async select<Row extends object>(table: string, options: SelectOptions): Promise<SelectResult<Row>> {
    const response = await this.request('GET', table, {
      query: this.buildSelectQuery(options),
      headers: options.count ? { Prefer: 'count=exact' } : undefined,
    });

    const json = await this.readJson(response);
    if (!Array.isArray(json)) {
      throw new SupabaseRestError(`Supabase table ${table} returned a non-list response.`, response.status, json);
    }

    return {
      rows: json as Row[],
      total: this.parseTotal(response.headers.get('content-range')),
    };
  }

  public async selectOne<Row extends object>(table: string, options: SelectOptions): Promise<Row | null> {
    const result = await this.select<Row>(table, {
      ...options,
      range: { offset: 0, limit: 1 },
    });

    return result.rows[0] ?? null;
  }

  public async upsert<Row extends object>(
    table: string,
    payload: Record<string, unknown>,
    options: WriteOptions = {},
  ): Promise<Row> {
    const query = new URLSearchParams();
    if (options.select) query.set('select', options.select);
    if (options.onConflict) query.set('on_conflict', options.onConflict);

    const response = await this.request('POST', table, {
      query,
      body: payload,
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
    });

    const json = await this.readJson(response);
    if (!Array.isArray(json) || !json[0] || typeof json[0] !== 'object') {
      throw new SupabaseRestError(`Supabase table ${table} returned an invalid write response.`, response.status, json);
    }

    return json[0] as Row;
  }

  /**
   * Calls a PostgREST RPC (`/rest/v1/rpc/<function>`).
   *
   * Used to wrap legacy Supabase database functions that the frontend used to
   * call directly. The backend service layer is now the only caller, so we can
   * keep the RPC contract while denying the client direct DB access.
   */
  public async rpc<Result = unknown>(functionName: string, payload: Record<string, unknown> = {}): Promise<Result> {
    const url = `${this.restUrl}/rpc/${encodeURIComponent(functionName)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Profile': this.schema,
        'Content-Profile': this.schema,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new SupabaseRestError(
        `Supabase RPC ${functionName} failed.`,
        response.status,
        await this.readJson(response),
      );
    }

    return (await this.readJson(response)) as Result;
  }

  private async request(
    method: string,
    table: string,
    options: {
      query?: URLSearchParams;
      body?: Record<string, unknown>;
      headers?: Record<string, string>;
    },
  ): Promise<Response> {
    const suffix = options.query?.toString();
    const url = `${this.restUrl}/${encodeURIComponent(table)}${suffix ? `?${suffix}` : ''}`;
    const response = await fetch(url, {
      method,
      headers: {
        apikey: this.serviceRoleKey,
        Authorization: `Bearer ${this.serviceRoleKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Accept-Profile': this.schema,
        'Content-Profile': this.schema,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      throw new SupabaseRestError(`Supabase request failed for ${table}.`, response.status, await this.readJson(response));
    }

    return response;
  }

  private buildSelectQuery(options: SelectOptions): URLSearchParams {
    const query = new URLSearchParams();
    query.set('select', options.select);

    options.filters?.forEach((filter) => {
      query.append(filter.column, this.encodeFilter(filter));
    });

    if (options.or) {
      query.set('or', `(${options.or})`);
    }

    options.order?.forEach((order) => {
      query.append('order', `${order.column}.${order.ascending === false ? 'desc' : 'asc'}`);
    });

    if (options.range) {
      query.set('offset', String(options.range.offset));
      query.set('limit', String(options.range.limit));
    }

    return query;
  }

  private encodeFilter(filter: Filter): string {
    if (filter.operator === 'in') {
      const values = Array.isArray(filter.value) ? filter.value : [filter.value];
      return `in.(${values.map((value) => this.formatFilterValue(value)).join(',')})`;
    }

    return `${filter.operator}.${this.formatFilterValue(filter.value as QueryValue)}`;
  }

  private formatFilterValue(value: QueryValue): string {
    if (value === null) return 'null';
    return String(value).replace(/"/g, '\\"');
  }

  private parseTotal(contentRange: string | null): number | null {
    if (!contentRange) return null;
    const match = /\/(?<total>\d+|\*)$/.exec(contentRange);
    if (!match?.groups || match.groups.total === '*') return null;
    return Number(match.groups.total);
  }

  private async readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
}
