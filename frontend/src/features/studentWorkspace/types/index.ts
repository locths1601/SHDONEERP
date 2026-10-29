export interface StudentListItemDto {
  id: string;
  code: string;
  partyType: string;
  status: string;
  legalEntityId: string;
  legalEntityName: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  applicationCount: number;
  createdAtUtc: string;
}

export interface StudentFilterQuery {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  status?: string;
  legalEntityId?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface StudentIdentificationDto {
  id: string;
  idType: string; // CitizenId, Passport, BirthCertificate, StudentId
  idNumber: string;
  issueDate?: string;
  expiryDate?: string;
  issuePlace?: string;
  isPrimary: boolean;
}

export interface StudentRelationshipDto {
  id: string;
  partyId: string;
  relatedPartyId?: string;
  relationshipType: string; // Father, Mother, Guardian, Sponsor, Spouse, Other
  relatedPersonName?: string;
  phoneNumber?: string;
  email?: string;
  nationalId?: string;
  occupation?: string;
  address?: string;
  isEmergencyContact: boolean;
  isLegalGuardian: boolean;
  isFinancialSponsor: boolean;
  notes?: string;
  isActive: boolean;
}

export interface StudentDetailDto {
  id: string;
  code: string;
  partyType: string;
  status: string;
  createdAtUtc: string;
  updatedAtUtc?: string;
  rowVersionBase64?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  roles: Array<{
    id: string;
    roleType: string;
    legalEntityId?: string;
    legalEntityName?: string;
    isActive: boolean;
  }>;
  contactMethods: Array<{
    id: string;
    contactType: string;
    value: string;
    isPrimary: boolean;
    notes?: string;
  }>;
  identifications: StudentIdentificationDto[];
  relationships: StudentRelationshipDto[];
}

export interface StudentApplicationListItemDto {
  id: string;
  applicationCode: string;
  studentPartyId: string;
  studentName: string;
  studentCode?: string;
  legalEntityId: string;
  legalEntityName: string;
  targetMarket: string;
  intakeTerm: string;
  programName: string;
  status: string; // Draft, Submitted, UnderReview, Accepted, Rejected, Withdrawn
  assignedUserId?: string;
  assignedUserName?: string;
  totalChecklistItems: number;
  verifiedChecklistItems: number;
  createdAtUtc: string;
}

export interface ApplicationDocumentLinkDto {
  id: string;
  checklistItemId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  sha256Checksum: string;
  linkedByUserId: string;
  linkedByName?: string;
  linkedAtUtc: string;
}

export interface ChecklistItemDto {
  id: string;
  studentApplicationId: string;
  itemCode: string;
  itemName: string;
  category: string; // Identity, Academic, Financial, Medical, Legal, Other
  isRequired: boolean;
  status: string; // Pending, Uploaded, Verified, Rejected
  notes?: string;
  rejectionReason?: string;
  verifiedByUserId?: string;
  verifiedByName?: string;
  verifiedAtUtc?: string;
  rowVersion: string;
  documentLinks: ApplicationDocumentLinkDto[];
}

export interface StudentApplicationDetailDto {
  id: string;
  applicationCode: string;
  studentPartyId: string;
  studentName: string;
  studentCode?: string;
  legalEntityId: string;
  legalEntityName: string;
  businessUnitId?: string;
  businessUnitName?: string;
  branchId?: string;
  branchName?: string;
  targetMarket: string;
  intakeTerm: string;
  programName: string;
  status: string;
  assignedUserId?: string;
  assignedUserName?: string;
  notes?: string;
  rowVersion: string;
  createdAtUtc: string;
  updatedAtUtc?: string;
  checklistItems: ChecklistItemDto[];
}

export interface CreateStudentPayload {
  code?: string;
  legalEntityId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  address?: string;
}

export interface AddIdentificationPayload {
  idType: string;
  idNumber: string;
  issueDate?: string;
  expiryDate?: string;
  issuePlace?: string;
  isPrimary?: boolean;
}

export interface AddRelationshipPayload {
  relationshipType: string;
  relatedPersonName: string;
  phoneNumber?: string;
  email?: string;
  nationalId?: string;
  occupation?: string;
  address?: string;
  isEmergencyContact?: boolean;
  isLegalGuardian?: boolean;
  isFinancialSponsor?: boolean;
  notes?: string;
}

export interface CreateApplicationPayload {
  applicationCode?: string;
  studentPartyId: string;
  legalEntityId: string;
  businessUnitId?: string;
  branchId?: string;
  targetMarket: string;
  intakeTerm: string;
  programName: string;
  assignedUserId?: string;
  notes?: string;
}

export interface UpdateApplicationPayload {
  targetMarket: string;
  intakeTerm: string;
  programName: string;
  notes?: string;
  rowVersion: string;
}

export interface UpdateApplicationStatusPayload {
  status: string;
  notes?: string;
  rowVersion: string;
}

export interface VerifyChecklistPayload {
  notes?: string;
  rowVersion: string;
}

export interface RejectChecklistPayload {
  rejectionReason: string;
  rowVersion: string;
}

export interface AddChecklistItemPayload {
  itemCode: string;
  itemName: string;
  category: string;
  isRequired?: boolean;
  notes?: string;
}

