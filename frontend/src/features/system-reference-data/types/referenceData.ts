export interface Catalog {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  ownerModule: string;
  scopePolicy: string;
  isSystem: boolean;
  isActive: boolean;
  statusLabel: 'ACTIVE' | 'INACTIVE';
  managementModeLabel: 'SYSTEM_CONTROLLED' | 'ADMIN_MANAGED';
  rowVersion?: string;
  rowVersionBase64: string;
  itemCount: number;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface CatalogFilter {
  searchTerm?: string;
  ownerModule?: string;
  isActive?: boolean | '';
  isSystem?: boolean | '';
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PagedCatalogResult {
  items: Catalog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateCatalogPayload {
  code: string;
  name: string;
  description?: string;
  ownerModule: string;
  isSystem?: boolean;
}

export interface UpdateCatalogPayload {
  name: string;
  description?: string;
  rowVersion: string;
}

export interface ChangeCatalogStatusPayload {
  rowVersion: string;
}

// ==========================================
// SYS-REF-02: Reference Data Items
// ==========================================

export interface ReferenceDataItem {
  id: string;
  catalogId: string;
  catalogCode?: string;
  catalogName?: string;
  catalogIsSystem?: boolean;
  catalogIsActive?: boolean;
  code: string;
  name: string;
  value?: string | null;
  displayOrder: number;
  isActive: boolean;
  statusLabel: 'ACTIVE' | 'INACTIVE';
  parentItemId?: string | null;
  parentItemCode?: string | null;
  parentItemName?: string | null;
  metadataJson?: string | null;
  rowVersion?: string;
  rowVersionBase64: string;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

export interface ItemFilter {
  catalogId: string;
  searchTerm?: string;
  isActive?: boolean | '';
  parentItemId?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PagedItemResult {
  items: ReferenceDataItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateItemPayload {
  code: string;
  name: string;
  value?: string;
  displayOrder?: number;
  parentItemId?: string | null;
  metadataJson?: string | null;
}

export interface UpdateItemPayload {
  name: string;
  value?: string;
  displayOrder: number;
  parentItemId?: string | null;
  metadataJson?: string | null;
  rowVersion: string;
}

export interface ChangeItemStatusPayload {
  rowVersion: string;
}

export interface ItemLookup {
  id: string;
  catalogId: string;
  catalogCode: string;
  code: string;
  name: string;
  value?: string;
  displayOrder: number;
  parentItemId?: string | null;
  metadataJson?: string | null;
}
