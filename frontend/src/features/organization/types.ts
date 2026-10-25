export interface LegalEntityDto {
  id: string;
  code: string;
  name: string;
  tradingName?: string | null;
  taxCode?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  website?: string | null;
  status: 'Active' | 'Inactive' | 'UnderLiquidation';
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  rowVersionBase64?: string | null;
}

export interface LegalEntityDetailDto extends LegalEntityDto {
  businessUnitCount: number;
  branchCount: number;
}

export interface LegalEntityLookupDto {
  id: string;
  code: string;
  name: string;
  status: string;
}

export interface CreateLegalEntityRequest {
  code: string;
  name: string;
  tradingName?: string;
  taxCode?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  status: number; // 1: Active, 2: Inactive, 3: UnderLiquidation
}

export interface UpdateLegalEntityRequest {
  name: string;
  tradingName?: string;
  taxCode?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  status: number;
  rowVersionBase64: string;
}

export interface LegalEntityFilterQuery {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
