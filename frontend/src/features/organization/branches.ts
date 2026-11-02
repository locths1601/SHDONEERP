export interface Branch {
  id: string;
  legalEntityId: string;
  legalEntityCode: string;
  legalEntityName: string;
  businessUnitId?: string | null;
  businessUnitCode?: string | null;
  businessUnitName?: string | null;
  code: string;
  name: string;
  address?: string | null;
  status: 'Active' | 'Inactive' | 'UnderLiquidation';
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  rowVersionBase64?: string | null;
}

export interface BranchDetail extends Branch {
}

export interface BranchFilter {
  page?: number;
  pageSize?: number;
  legalEntityId?: string;
  businessUnitId?: string;
  searchTerm?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateBranchRequest {
  legalEntityId: string;
  businessUnitId?: string | null;
  code: string;
  name: string;
  address?: string | null;
  status: number;
}

export interface UpdateBranchRequest {
  businessUnitId?: string | null;
  name: string;
  address?: string | null;
  status: number;
  rowVersionBase64: string;
}

export interface BranchOption {
  id: string;
  legalEntityId: string;
  businessUnitId?: string | null;
  code: string;
  name: string;
  status: string;
}

