import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService, LoginPayload } from '../services/authService';
import { useAuthStore } from '../../../stores/authStore';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
    onSuccess: (result) => {
      setAuth(result.user, result.accessToken, result.refreshToken);
      toast.success(`Chào mừng trở lại, ${result.user.fullName}!`);
      navigate('/organization/legal-entities');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Đăng nhập không thành công');
    },
  });
}
