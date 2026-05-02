import type { OrgTopLevelRecord, OrgUnitRecord } from '../../modules/structure/contracts/structure.types.js';
import type { CompanyRecord } from '../../modules/company/contracts/company.types.js';

export interface InsertParentLevelTransitionInput {
  company: CompanyRecord;
  parentTopLevel: OrgTopLevelRecord;
  childTopLevelIds: string[];
  nextOrgLevels: string[];
  orgUnitName?: string;
}

export interface InsertParentLevelTransitionResult {
  parentTopLevel: OrgTopLevelRecord;
  movedTopLevels: OrgTopLevelRecord[];
  company: CompanyRecord;
}

export interface StructureRepository {
  listTopLevels(companyId: string): Promise<OrgTopLevelRecord[]>;
  listUnits(companyId: string): Promise<OrgUnitRecord[]>;
  findTopLevelById(companyId: string, topLevelId: string): Promise<OrgTopLevelRecord | null>;
  findUnitById(companyId: string, unitId: string): Promise<OrgUnitRecord | null>;
  saveTopLevel(topLevel: OrgTopLevelRecord): Promise<OrgTopLevelRecord>;
  saveUnit(unit: OrgUnitRecord): Promise<OrgUnitRecord>;
  insertParentLevelTransition(input: InsertParentLevelTransitionInput): Promise<InsertParentLevelTransitionResult>;
}
