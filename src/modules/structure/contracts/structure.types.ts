export interface OrgTopLevelRecord {
  id: string;
  companyId: string;
  name: string;
  levelIndex: number;
  parentId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgUnitRecord {
  id: string;
  companyId: string;
  name: string;
  code: string | null;
  topLevelId: string | null;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgTopLevelView {
  id: string;
  name: string;
  levelIndex: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrgUnitView {
  id: string;
  name: string;
  code: string | null;
  topLevelId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StructureTreeNode {
  id: string;
  type: 'top-level' | 'unit';
  name: string;
  levelIndex: number | null;
  children: StructureTreeNode[];
}
