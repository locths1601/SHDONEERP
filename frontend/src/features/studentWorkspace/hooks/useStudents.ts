import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { studentWorkspaceService } from '../services/studentWorkspaceService';
import {
  StudentFilterQuery,
  CreateStudentPayload,
  AddIdentificationPayload,
  AddRelationshipPayload,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  UpdateApplicationStatusPayload,
  VerifyChecklistPayload,
  RejectChecklistPayload,
  AddChecklistItemPayload,
} from '../types';

export const useStudentsPaged = (query: StudentFilterQuery) => {
  return useQuery({
    queryKey: ['students-paged', query],
    queryFn: () => studentWorkspaceService.getStudentsPaged(query),
  });
};

export const useStudentDetail = (id: string | null | undefined) => {
  return useQuery({
    queryKey: ['student-detail', id],
    queryFn: () => (id ? studentWorkspaceService.getStudentDetail(id) : null),
    enabled: !!id,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStudentPayload) => studentWorkspaceService.createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students-paged'] });
      toast.success('Tạo hồ sơ học viên thành công.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi tạo hồ sơ học viên.');
    },
  });
};

export const useAddIdentification = (partyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddIdentificationPayload) =>
      studentWorkspaceService.addIdentification(partyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', partyId] });
      toast.success('Bổ sung giấy tờ định danh thành công.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi thêm giấy tờ định danh.');
    },
  });
};

export const useAddRelationship = (partyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddRelationshipPayload) =>
      studentWorkspaceService.addRelationship(partyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-detail', partyId] });
      toast.success('Bổ sung thân nhân / người giám hộ thành công.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi thêm thân nhân / người giám hộ.');
    },
  });
};

export const useStudentApplications = (studentPartyId: string | null | undefined) => {
  return useQuery({
    queryKey: ['student-applications', studentPartyId],
    queryFn: () => (studentPartyId ? studentWorkspaceService.getApplicationsByStudentPartyId(studentPartyId) : []),
    enabled: !!studentPartyId,
  });
};

export const useApplicationDetail = (applicationId: string | null | undefined) => {
  return useQuery({
    queryKey: ['application-detail', applicationId],
    queryFn: () => (applicationId ? studentWorkspaceService.getApplicationDetail(applicationId) : null),
    enabled: !!applicationId,
  });
};

export const useCreateApplication = (studentPartyId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApplicationPayload) => studentWorkspaceService.createApplication(data),
    onSuccess: () => {
      if (studentPartyId) {
        queryClient.invalidateQueries({ queryKey: ['student-applications', studentPartyId] });
      }
      queryClient.invalidateQueries({ queryKey: ['students-paged'] });
      toast.success('Tạo hồ sơ tuyển sinh / du học thành công.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi tạo hồ sơ tuyển sinh.');
    },
  });
};

export const useUpdateApplication = (applicationId: string, studentPartyId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateApplicationPayload) =>
      studentWorkspaceService.updateApplication(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      if (studentPartyId) {
        queryClient.invalidateQueries({ queryKey: ['student-applications', studentPartyId] });
      }
      toast.success('Cập nhật hồ sơ tuyển sinh thành công.');
    },
    onError: (error: any) => {
      if (error?.code === 'CONCURRENCY_CONFLICT' || error?.status === 409) {
        toast.error('Xung đột dữ liệu: Hồ sơ đã được chỉnh sửa bởi phiên khác. Vui lòng tải lại trang.');
      } else {
        toast.error(error?.message || 'Lỗi khi cập nhật hồ sơ.');
      }
    },
  });
};

export const useUpdateApplicationStatus = (applicationId: string, studentPartyId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateApplicationStatusPayload) =>
      studentWorkspaceService.updateApplicationStatus(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      if (studentPartyId) {
        queryClient.invalidateQueries({ queryKey: ['student-applications', studentPartyId] });
      }
      toast.success('Cập nhật trạng thái hồ sơ thành công.');
    },
    onError: (error: any) => {
      if (error?.code === 'CONCURRENCY_CONFLICT' || error?.status === 409) {
        toast.error('Xung đột dữ liệu: Trạng thái đã thay đổi bởi người khác.');
      } else {
        toast.error(error?.message || 'Lỗi khi chuyển trạng thái.');
      }
    },
  });
};

export const useVerifyChecklistItem = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: VerifyChecklistPayload }) =>
      studentWorkspaceService.verifyChecklistItem(applicationId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      toast.success('Đã thẩm định và chấp thuận hạng mục hồ sơ.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi thẩm định tài liệu.');
    },
  });
};

export const useRejectChecklistItem = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: RejectChecklistPayload }) =>
      studentWorkspaceService.rejectChecklistItem(applicationId, itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      toast.success('Đã từ chối hạng mục tài liệu.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi từ chối tài liệu.');
    },
  });
};

export const useResetChecklistItem = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      studentWorkspaceService.resetChecklistItem(applicationId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      toast.success('Đã đặt lại hạng mục về trạng thái Chờ bổ sung.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi đặt lại trạng thái.');
    },
  });
};

export const useUploadDocument = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, file }: { itemId: string; file: File }) =>
      studentWorkspaceService.uploadDocument(applicationId, itemId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      toast.success('Tải lên và đính kèm tài liệu thành công.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi tải lên tài liệu.');
    },
  });
};

export const useAddChecklistItem = (applicationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddChecklistItemPayload) =>
      studentWorkspaceService.addChecklistItem(applicationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application-detail', applicationId] });
      toast.success('Thêm hạng mục tài liệu thành công.');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Lỗi khi thêm hạng mục tài liệu.');
    },
  });
};

