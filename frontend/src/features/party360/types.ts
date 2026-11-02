export type PartyType = 'Person' | 'Organization';

export interface PartyListItemDto {
  id: string;
  partyType: PartyType;
  code: string;
  displayName: string;
  status: string;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  roleCount: number;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  rowVersionBase64: string;
}

export interface PartyRoleDto {
  id: string;
  partyId: string;
  roleType: string;
  legalEntityId?: string | null;
  legalEntityCode?: string | null;
  legalEntityName?: string | null;
  isActive: boolean;
  createdAtUtc: string;
}

export interface PartyContactMethodDto {
  id: string;
  partyId: string;
  contactType: string;
  value: string;
  isPrimary: boolean;
  createdAtUtc: string;
}

export interface PartyDetailDto {
  id: string;
  partyType: PartyType;
  code: string;
  status: string;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  rowVersionBase64: string;

  // Person fields
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  nationality?: string | null;

  // Organization fields
  companyName?: string | null;
  tradingName?: string | null;
  taxId?: string | null;
  registrationNumber?: string | null;

  roles: PartyRoleDto[];
  contactMethods: PartyContactMethodDto[];
}

export interface PartyFilterQuery {
  pageNumber: number;
  pageSize: number;
  partyType?: string;
  searchTerm?: string;
  status?: string;
  legalEntityId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreatePersonPartyPayload {
  code: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  initialRoleType?: string;
  legalEntityId?: string;
}

export interface CreateOrganizationPartyPayload {
  code: string;
  companyName: string;
  tradingName?: string;
  taxId?: string;
  registrationNumber?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  initialRoleType?: string;
  legalEntityId?: string;
}

export interface UpdatePersonPartyPayload {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  status: string;
  rowVersionBase64?: string;
}

export interface UpdateOrganizationPartyPayload {
  companyName: string;
  tradingName?: string;
  taxId?: string;
  registrationNumber?: string;
  status: string;
  rowVersionBase64?: string;
}

