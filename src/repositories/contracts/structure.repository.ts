import type { OrgTopLevelRecord, OrgUnitRecord } from '../../modules/structure/contracts/structure.types.js';

export interface StructureRepository {
  listTopLevels(companyId: string): Promise<OrgTopLevelRecord[]>;
  listUnits(companyId: string): Promise<OrgUnitRecord[]>;
  findTopLevelById(companyId: string, topLevelId: string): Promise<OrgTopLevelRecord | null>;
  findUnitById(companyId: string, unitId: string): Promise<OrgUnitRecord | null>;
  saveTopLevel(topLevel: OrgTopLevelRecord): Promise<OrgTopLevelRecord>;
  saveUnit(unit: OrgUnitRecord): Promise<OrgUnitRecord>;
}
