import { randomUUID } from 'node:crypto';
import { AppError } from '../lib/errors.js';
import { toTopLevelView, toUnitView } from '../lib/dto-mappers.js';
import type { StructureTreeNode } from '../modules/structure/contracts/structure.types.js';
import type { CompanyRepository } from '../repositories/contracts/company.repository.js';
import type { StructureRepository } from '../repositories/contracts/structure.repository.js';
import type { UserRepository } from '../repositories/contracts/user.repository.js';

interface TopLevelInput {
  name: string;
  levelIndex: number;
  parentId?: string | null;
}

interface TopLevelUpdateInput {
  name?: string;
  levelIndex?: number;
  parentId?: string | null;
}

interface UnitInput {
  name: string;
  code?: string | null;
  topLevelId?: string | null;
  active?: boolean;
}

interface UnitUpdateInput {
  name?: string;
  code?: string | null;
  topLevelId?: string | null;
  active?: boolean;
}

export class OrganizationService {
  public constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly structureRepository: StructureRepository,
    private readonly userRepository: UserRepository,
  ) {}

  public async getStructure(companyId: string) {
    const company = await this.getCompany(companyId);
    const [topLevels, units] = await Promise.all([
      this.structureRepository.listTopLevels(companyId),
      this.structureRepository.listUnits(companyId),
    ]);

    return {
      companyId,
      orgLevels: [...company.general.orgLevels],
      orgUnitName: company.general.orgUnitName,
      topLevels: topLevels
        .slice()
        .sort((left, right) => left.levelIndex - right.levelIndex || left.name.localeCompare(right.name))
        .map(toTopLevelView),
      units: units.slice().sort((left, right) => left.name.localeCompare(right.name)).map(toUnitView),
      tree: this.buildTree(topLevels, units),
    };
  }

  public async listTopLevels(companyId: string) {
    const topLevels = await this.structureRepository.listTopLevels(companyId);
    return topLevels
      .slice()
      .sort((left, right) => left.levelIndex - right.levelIndex || left.name.localeCompare(right.name))
      .map(toTopLevelView);
  }

  public async listUnits(companyId: string) {
    const units = await this.structureRepository.listUnits(companyId);
    return units.slice().sort((left, right) => left.name.localeCompare(right.name)).map(toUnitView);
  }

  public async createTopLevel(companyId: string, input: TopLevelInput) {
    const company = await this.getCompany(companyId);
    await this.assertLevelIndex(company.general.orgLevels.length, input.levelIndex);
    await this.assertValidParent(companyId, null, input.parentId ?? null, input.levelIndex);

    const now = new Date().toISOString();
    const topLevel = {
      id: randomUUID(),
      companyId,
      name: input.name,
      levelIndex: input.levelIndex,
      parentId: input.parentId ?? null,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return toTopLevelView(await this.structureRepository.saveTopLevel(topLevel));
  }

  public async updateTopLevel(companyId: string, topLevelId: string, input: TopLevelUpdateInput) {
    const currentTopLevel = await this.structureRepository.findTopLevelById(companyId, topLevelId);

    if (!currentTopLevel) {
      throw new AppError(404, 'NOT_FOUND', 'Top-level structure node not found.');
    }

    const company = await this.getCompany(companyId);
    const nextLevelIndex = input.levelIndex ?? currentTopLevel.levelIndex;
    await this.assertLevelIndex(company.general.orgLevels.length, nextLevelIndex);
    await this.assertValidParent(companyId, currentTopLevel.id, input.parentId ?? currentTopLevel.parentId, nextLevelIndex);

    const updatedTopLevel = {
      ...currentTopLevel,
      name: input.name ?? currentTopLevel.name,
      levelIndex: nextLevelIndex,
      parentId: input.parentId === undefined ? currentTopLevel.parentId : input.parentId,
      updatedAt: new Date().toISOString(),
    };

    return toTopLevelView(await this.structureRepository.saveTopLevel(updatedTopLevel));
  }

  public async deleteTopLevel(companyId: string, topLevelId: string) {
    const topLevel = await this.structureRepository.findTopLevelById(companyId, topLevelId);

    if (!topLevel) {
      throw new AppError(404, 'NOT_FOUND', 'Top-level structure node not found.');
    }

    const [topLevels, units] = await Promise.all([
      this.structureRepository.listTopLevels(companyId),
      this.structureRepository.listUnits(companyId),
    ]);

    if (topLevels.some((entry) => entry.parentId === topLevelId) || units.some((entry) => entry.topLevelId === topLevelId)) {
      throw new AppError(409, 'RESOURCE_IN_USE', 'Top-level node still has child nodes or units attached.');
    }

    const deletedAt = new Date().toISOString();
    await this.structureRepository.saveTopLevel({
      ...topLevel,
      deletedAt,
      updatedAt: deletedAt,
    });

    return {
      deleted: true,
      id: topLevelId,
    };
  }

  public async createUnit(companyId: string, input: UnitInput) {
    const company = await this.getCompany(companyId);
    await this.assertValidUnitTopLevel(companyId, company.general.orgLevels.length, input.topLevelId ?? null);

    const now = new Date().toISOString();
    const unit = {
      id: randomUUID(),
      companyId,
      name: input.name,
      code: input.code ?? null,
      topLevelId: input.topLevelId ?? null,
      active: input.active ?? true,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return toUnitView(await this.structureRepository.saveUnit(unit));
  }

  public async updateUnit(companyId: string, unitId: string, input: UnitUpdateInput) {
    const unit = await this.structureRepository.findUnitById(companyId, unitId);

    if (!unit) {
      throw new AppError(404, 'NOT_FOUND', 'Organizational unit not found.');
    }

    const nextTopLevelId = input.topLevelId === undefined ? unit.topLevelId : input.topLevelId;
    const company = await this.getCompany(companyId);
    await this.assertValidUnitTopLevel(companyId, company.general.orgLevels.length, nextTopLevelId);

    const updatedUnit = {
      ...unit,
      name: input.name ?? unit.name,
      code: input.code === undefined ? unit.code : input.code,
      topLevelId: nextTopLevelId,
      active: input.active ?? unit.active,
      updatedAt: new Date().toISOString(),
    };

    return toUnitView(await this.structureRepository.saveUnit(updatedUnit));
  }

  public async deleteUnit(companyId: string, unitId: string) {
    const unit = await this.structureRepository.findUnitById(companyId, unitId);

    if (!unit) {
      throw new AppError(404, 'NOT_FOUND', 'Organizational unit not found.');
    }

    const activeUsersCount = await this.userRepository.countByOrgUnit(companyId, unitId);

    if (activeUsersCount > 0) {
      throw new AppError(409, 'RESOURCE_IN_USE', 'Unit still has active users assigned.');
    }

    const deletedAt = new Date().toISOString();
    await this.structureRepository.saveUnit({
      ...unit,
      deletedAt,
      updatedAt: deletedAt,
    });

    return {
      deleted: true,
      id: unitId,
    };
  }

  private async getCompany(companyId: string) {
    const company = await this.companyRepository.findById(companyId);

    if (!company) {
      throw new AppError(404, 'NOT_FOUND', 'Company not found.');
    }

    return company;
  }

  private async assertLevelIndex(maxLevels: number, levelIndex: number): Promise<void> {
    if (levelIndex < 1 || levelIndex > maxLevels) {
      throw new AppError(400, 'BAD_REQUEST', 'Top-level node uses an invalid hierarchy level.');
    }
  }

  private async assertValidUnitTopLevel(companyId: string, configuredLevels: number, topLevelId: string | null): Promise<void> {
    if (configuredLevels === 0) {
      if (topLevelId) {
        throw new AppError(400, 'BAD_REQUEST', 'Organizational unit cannot reference a top-level node when no hierarchy level is configured.');
      }

      return;
    }

    if (!topLevelId) {
      throw new AppError(400, 'BAD_REQUEST', 'Organizational unit must reference the last configured hierarchy level.');
    }

    const topLevel = await this.structureRepository.findTopLevelById(companyId, topLevelId);

    if (!topLevel) {
      throw new AppError(400, 'BAD_REQUEST', 'Referenced top-level node was not found.');
    }

    if (topLevel.levelIndex !== configuredLevels) {
      throw new AppError(400, 'BAD_REQUEST', 'Organizational unit must reference the last configured hierarchy level.');
    }
  }

  private async assertValidParent(
    companyId: string,
    currentTopLevelId: string | null,
    parentId: string | null,
    levelIndex: number,
  ): Promise<void> {
    if (!parentId) {
      return;
    }

    if (currentTopLevelId && currentTopLevelId === parentId) {
      throw new AppError(400, 'BAD_REQUEST', 'A top-level node cannot be its own parent.');
    }

    const topLevels = await this.structureRepository.listTopLevels(companyId);
    const parentNode = topLevels.find((entry) => entry.id === parentId);

    if (!parentNode) {
      throw new AppError(400, 'BAD_REQUEST', 'Referenced parent top-level node was not found.');
    }

    if (parentNode.levelIndex >= levelIndex) {
      throw new AppError(400, 'BAD_REQUEST', 'Parent top-level node must belong to a higher hierarchy level.');
    }

    if (!currentTopLevelId) {
      return;
    }

    const topLevelsById = new Map(topLevels.map((topLevel) => [topLevel.id, topLevel]));
    let cursor = parentNode.parentId;

    while (cursor) {
      if (cursor === currentTopLevelId) {
        throw new AppError(400, 'BAD_REQUEST', 'Circular hierarchy detected.');
      }

      cursor = topLevelsById.get(cursor)?.parentId ?? null;
    }
  }

  private buildTree(
    topLevels: Awaited<ReturnType<StructureRepository['listTopLevels']>>,
    units: Awaited<ReturnType<StructureRepository['listUnits']>>,
  ): StructureTreeNode[] {
    const topLevelNodes = new Map<string, StructureTreeNode>();

    topLevels.forEach((topLevel) => {
      topLevelNodes.set(topLevel.id, {
        id: topLevel.id,
        type: 'top-level',
        name: topLevel.name,
        levelIndex: topLevel.levelIndex,
        children: [],
      });
    });

    const roots: StructureTreeNode[] = [];

    topLevels
      .slice()
      .sort((left, right) => left.levelIndex - right.levelIndex || left.name.localeCompare(right.name))
      .forEach((topLevel) => {
        const node = topLevelNodes.get(topLevel.id)!;
        const parentNode = topLevel.parentId ? topLevelNodes.get(topLevel.parentId) : null;

        if (parentNode) {
          parentNode.children.push(node);
        } else {
          roots.push(node);
        }
      });

    units
      .slice()
      .sort((left, right) => left.name.localeCompare(right.name))
      .forEach((unit) => {
        const unitNode: StructureTreeNode = {
          id: unit.id,
          type: 'unit',
          name: unit.name,
          levelIndex: null,
          children: [],
        };

        const parentNode = unit.topLevelId ? topLevelNodes.get(unit.topLevelId) : null;

        if (parentNode) {
          parentNode.children.push(unitNode);
        } else {
          roots.push(unitNode);
        }
      });

    return roots;
  }
}
