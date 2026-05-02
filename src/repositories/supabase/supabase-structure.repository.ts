import type { OrgTopLevelRecord, OrgUnitRecord } from '../../modules/structure/contracts/structure.types.js';
import { AppError } from '../../lib/errors.js';
import type {
  InsertParentLevelTransitionInput,
  InsertParentLevelTransitionResult,
  StructureRepository,
} from '../contracts/structure.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
import { SupabaseRestError } from './supabase-rest-client.js';
import {
  fromTopLevelRecord,
  fromUnitRecord,
  TOP_LEVEL_SELECT,
  toTopLevelRecord,
  toUnitRecord,
  UNIT_SELECT,
  type TopLevelRow,
  type UnitRow,
} from './supabase-row-mappers.js';

export class SupabaseStructureRepository implements StructureRepository {
  public constructor(private readonly client: SupabaseRestClient) {}

  public async listTopLevels(companyId: string): Promise<OrgTopLevelRecord[]> {
    const result = await this.client.select<TopLevelRow>('org_top_levels', {
      select: TOP_LEVEL_SELECT,
      filters: this.visibleTenantFilters(companyId, []),
      order: [{ column: 'level_index' }, { column: 'name' }],
    });

    return result.rows.map(toTopLevelRecord);
  }

  public async listUnits(companyId: string): Promise<OrgUnitRecord[]> {
    const result = await this.client.select<UnitRow>('org_units', {
      select: UNIT_SELECT,
      filters: this.visibleTenantFilters(companyId, []),
      order: [{ column: 'name' }],
    });

    return result.rows.map(toUnitRecord);
  }

  public async findTopLevelById(companyId: string, topLevelId: string): Promise<OrgTopLevelRecord | null> {
    const row = await this.client.selectOne<TopLevelRow>('org_top_levels', {
      select: TOP_LEVEL_SELECT,
      filters: this.visibleTenantFilters(companyId, [{ column: 'id', operator: 'eq', value: topLevelId }]),
    });

    return row ? toTopLevelRecord(row) : null;
  }

  public async findUnitById(companyId: string, unitId: string): Promise<OrgUnitRecord | null> {
    const row = await this.client.selectOne<UnitRow>('org_units', {
      select: UNIT_SELECT,
      filters: this.visibleTenantFilters(companyId, [{ column: 'id', operator: 'eq', value: unitId }]),
    });

    return row ? toUnitRecord(row) : null;
  }

  public async saveTopLevel(topLevel: OrgTopLevelRecord): Promise<OrgTopLevelRecord> {
    const row = await this.client.upsert<TopLevelRow>('org_top_levels', fromTopLevelRecord(topLevel), {
      select: TOP_LEVEL_SELECT,
      onConflict: 'id',
    });

    return toTopLevelRecord(row);
  }

  public async saveUnit(unit: OrgUnitRecord): Promise<OrgUnitRecord> {
    const row = await this.client.upsert<UnitRow>('org_units', fromUnitRecord(unit), {
      select: UNIT_SELECT,
      onConflict: 'id',
    });

    return toUnitRecord(row);
  }

  public async insertParentLevelTransition(
    input: InsertParentLevelTransitionInput,
  ): Promise<InsertParentLevelTransitionResult> {
    try {
      await this.client.rpc('storepage_insert_parent_level', {
        p_company_id: input.company.id,
        p_parent_id: input.parentTopLevel.id,
        p_parent_name: input.parentTopLevel.name,
        p_next_org_levels: input.nextOrgLevels,
        p_org_unit_name: input.orgUnitName ?? input.company.general.orgUnitName,
        p_child_top_level_ids: input.childTopLevelIds,
      });
    } catch (err) {
      if (err instanceof SupabaseRestError && err.status === 404 && this.isMissingInsertParentLevelRpc(err.body)) {
        throw new AppError(
          503,
          'DATABASE_SCHEMA_OUT_OF_DATE',
          'Database transition function is not installed. Apply supabase/20260502_insert_parent_level_transition.sql and retry.',
        );
      }

      throw err;
    }

    const topLevels = await this.listTopLevels(input.company.id);
    const movedIds = new Set(input.childTopLevelIds);
    const parentTopLevel = topLevels.find((topLevel) => topLevel.id === input.parentTopLevel.id) ?? input.parentTopLevel;
    const movedTopLevels = topLevels.filter((topLevel) => movedIds.has(topLevel.id));

    return {
      parentTopLevel,
      movedTopLevels,
      company: {
        ...input.company,
        general: {
          ...input.company.general,
          orgLevels: [...input.nextOrgLevels],
          orgUnitName: input.orgUnitName ?? input.company.general.orgUnitName,
        },
        updatedAt: parentTopLevel.updatedAt,
      },
    };
  }

  private visibleTenantFilters(
    companyId: string,
    extra: Array<{ column: string; operator: 'eq' | 'is' | 'ilike' | 'in'; value: string | number | boolean | null }>,
  ) {
    return [
      { column: 'company_id', operator: 'eq' as const, value: companyId },
      { column: 'deleted_at', operator: 'is' as const, value: null },
      ...extra,
    ];
  }

  private isMissingInsertParentLevelRpc(body: unknown): boolean {
    if (!body || typeof body !== 'object') return false;
    const payload = body as { code?: unknown; message?: unknown };
    return (
      payload.code === 'PGRST202' &&
      typeof payload.message === 'string' &&
      payload.message.includes('storepage_insert_parent_level')
    );
  }
}
