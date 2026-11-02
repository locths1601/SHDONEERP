import { apiClient } from '../../../lib/apiClient';
import {
  Catalog,
  CatalogFilter,
  PagedCatalogResult,
  CreateCatalogPayload,
  UpdateCatalogPayload,
  ChangeCatalogStatusPayload,
  ReferenceDataItem,
  ItemFilter,
  PagedItemResult,
  CreateItemPayload,
  UpdateItemPayload,
  ChangeItemStatusPayload,
  ItemLookup,
} from '../types/referenceData';

const BASE_CATALOGS_ENDPOINT = '/system/reference-data/catalogs';
const BASE_LOOKUP_ENDPOINT = '/system/reference-data/lookup';

export const referenceDataService = {
  // Catalogs
  getCatalogs: async (filter: CatalogFilter): Promise<PagedCatalogResult> => {
    const params: Record<string, any> = {
      page: filter.page,
      pageSize: filter.pageSize,
      sortBy: filter.sortBy || 'Code',
      sortOrder: filter.sortOrder || 'ASC',
    };

    if (filter.searchTerm) params.searchTerm = filter.searchTerm;
    if (filter.ownerModule) params.ownerModule = filter.ownerModule;
    if (filter.isActive !== '' && filter.isActive !== undefined) params.isActive = filter.isActive;
    if (filter.isSystem !== '' && filter.isSystem !== undefined) params.isSystem = filter.isSystem;

    return apiClient.get<PagedCatalogResult>(BASE_CATALOGS_ENDPOINT, params);
  },

  getCatalogById: async (id: string): Promise<Catalog> => {
    return apiClient.get<Catalog>(`${BASE_CATALOGS_ENDPOINT}/${id}`);
  },

  createCatalog: async (payload: CreateCatalogPayload): Promise<string> => {
    return apiClient.post<string>(BASE_CATALOGS_ENDPOINT, payload);
  },

  updateCatalog: async (id: string, payload: UpdateCatalogPayload): Promise<void> => {
    return apiClient.put<void>(`${BASE_CATALOGS_ENDPOINT}/${id}`, payload);
  },

  deactivateCatalog: async (id: string, payload: ChangeCatalogStatusPayload): Promise<void> => {
    return apiClient.put<void>(`${BASE_CATALOGS_ENDPOINT}/${id}/deactivate`, payload);
  },

  activateCatalog: async (id: string, payload: ChangeCatalogStatusPayload): Promise<void> => {
    return apiClient.put<void>(`${BASE_CATALOGS_ENDPOINT}/${id}/activate`, payload);
  },

  // Items
  getItems: async (catalogId: string, filter: ItemFilter): Promise<PagedItemResult> => {
    const params: Record<string, any> = {
      page: filter.page,
      pageSize: filter.pageSize,
      sortBy: filter.sortBy || 'DisplayOrder',
      sortOrder: filter.sortOrder || 'ASC',
    };

    if (filter.searchTerm) params.searchTerm = filter.searchTerm;
    if (filter.isActive !== '' && filter.isActive !== undefined) params.isActive = filter.isActive;
    if (filter.parentItemId) params.parentItemId = filter.parentItemId;

    return apiClient.get<PagedItemResult>(`${BASE_CATALOGS_ENDPOINT}/${catalogId}/items`, params);
  },

  getItemById: async (catalogId: string, itemId: string): Promise<ReferenceDataItem> => {
    return apiClient.get<ReferenceDataItem>(`${BASE_CATALOGS_ENDPOINT}/${catalogId}/items/${itemId}`);
  },

  createItem: async (catalogId: string, payload: CreateItemPayload): Promise<string> => {
    return apiClient.post<string>(`${BASE_CATALOGS_ENDPOINT}/${catalogId}/items`, payload);
  },

  updateItem: async (catalogId: string, itemId: string, payload: UpdateItemPayload): Promise<void> => {
    return apiClient.put<void>(`${BASE_CATALOGS_ENDPOINT}/${catalogId}/items/${itemId}`, payload);
  },

  deactivateItem: async (catalogId: string, itemId: string, payload: ChangeItemStatusPayload): Promise<void> => {
    return apiClient.put<void>(`${BASE_CATALOGS_ENDPOINT}/${catalogId}/items/${itemId}/deactivate`, payload);
  },

  activateItem: async (catalogId: string, itemId: string, payload: ChangeItemStatusPayload): Promise<void> => {
    return apiClient.put<void>(`${BASE_CATALOGS_ENDPOINT}/${catalogId}/items/${itemId}/activate`, payload);
  },

  // Lookup
  getLookupByCatalogCode: async (catalogCode: string): Promise<ItemLookup[]> => {
    return apiClient.get<ItemLookup[]>(`${BASE_LOOKUP_ENDPOINT}/${catalogCode}`);
  },
};
