import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { partyService } from '../services/partyService';
import {
  PartyFilterQuery,
  CreatePersonPartyPayload,
  CreateOrganizationPartyPayload,
  UpdatePersonPartyPayload,
  UpdateOrganizationPartyPayload,
} from '../types';

export const usePartiesPaged = (query: PartyFilterQuery) => {
  return useQuery({
    queryKey: ['parties', query],
    queryFn: () => partyService.getPaged(query),
  });
};

export const usePartyDetail = (id: string | null) => {
  return useQuery({
    queryKey: ['party-detail', id],
    queryFn: () => (id ? partyService.getById(id) : null),
    enabled: !!id,
  });
};

export const useCreatePersonParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePersonPartyPayload) => partyService.createPerson(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Tạo hồ sơ cá nhân thành công.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo hồ sơ cá nhân.');
    },
  });
};

export const useCreateOrgParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrganizationPartyPayload) => partyService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Tạo hồ sơ tổ chức thành công.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo hồ sơ tổ chức.');
    },
  });
};

export const useUpdatePersonParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonPartyPayload }) =>
      partyService.updatePerson(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['party-detail'] });
      toast.success('Cập nhật hồ sơ thành công.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật hồ sơ.');
    },
  });
};

export const useUpdateOrgParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrganizationPartyPayload }) =>
      partyService.updateOrganization(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['party-detail'] });
      toast.success('Cập nhật hồ sơ đối tác thành công.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật đối tác.');
    },
  });
};

export const useDeleteParty = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partyService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast.success('Xóa hồ sơ thành công.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa hồ sơ.');
    },
  });
};

