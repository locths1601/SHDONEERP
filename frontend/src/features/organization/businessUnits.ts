export interface BusinessUnit {
  id: string;
  legalEntityId: string;
  legalEntityCode: string;
  legalEntityName: string;
  code: string;
  name: string;
  status: 'Active' | 'Inactive' | 'UnderLiquidation';
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  rowVersionBase64?: string | null;
}

export interface BusinessUnitDetail extends BusinessUnit {
  branchCount: number;
}

export interface BusinessUnitFilter {
  page?: number;
  pageSize?: number;
  legalEntityId?: string;
  searchTerm?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateBusinessUnitRequest {
  legalEntityId: string;
  code: string;
  name: string;
  status: number;
}

export interface UpdateBusinessUnitRequest {
  name: string;
  status: number;
  rowVersionBase64: string;
}

export interface LegalEntityOption {
  id: string;
  code: string;
  name: string;
  status: string;
}
