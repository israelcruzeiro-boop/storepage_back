import type { OrgTopLevelRecord, OrgUnitRecord } from '../../modules/structure/contracts/structure.types.js';
import type { StructureRepository } from '../contracts/structure.repository.js';
import type { SupabaseRestClient } from './supabase-rest-client.js';
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
}
