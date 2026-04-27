import type { OrgTopLevelRecord, OrgUnitRecord } from '../../modules/structure/contracts/structure.types.js';
import type { StructureRepository } from '../contracts/structure.repository.js';
import type { InMemoryStore } from './in-memory-store.js';

function isVisible<T extends { deletedAt: string | null }>(entity: T): boolean {
  return entity.deletedAt === null;
}

export class InMemoryStructureRepository implements StructureRepository {
  public constructor(private readonly store: InMemoryStore) {}

  public async listTopLevels(companyId: string): Promise<OrgTopLevelRecord[]> {
    return this.store.listTopLevels().filter((topLevel) => isVisible(topLevel) && topLevel.companyId === companyId);
  }

  public async listUnits(companyId: string): Promise<OrgUnitRecord[]> {
    return this.store.listUnits().filter((unit) => isVisible(unit) && unit.companyId === companyId);
  }

  public async findTopLevelById(companyId: string, topLevelId: string): Promise<OrgTopLevelRecord | null> {
    const topLevel = this.store.getTopLevel(topLevelId);
    return topLevel && isVisible(topLevel) && topLevel.companyId === companyId ? topLevel : null;
  }

  public async findUnitById(companyId: string, unitId: string): Promise<OrgUnitRecord | null> {
    const unit = this.store.getUnit(unitId);
    return unit && isVisible(unit) && unit.companyId === companyId ? unit : null;
  }

  public async saveTopLevel(topLevel: OrgTopLevelRecord): Promise<OrgTopLevelRecord> {
    return this.store.setTopLevel(topLevel);
  }

  public async saveUnit(unit: OrgUnitRecord): Promise<OrgUnitRecord> {
    return this.store.setUnit(unit);
  }
}
