import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/common/Button';
import { useLogin } from '../hooks/useAuth';
import { LoginPayload } from '../services/authService';
import { Lock, User } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginPayload>({
    defaultValues: {
      usernameOrEmail: 'admin@shdcorp.vn',
      password: '',
    },
  });

  const onSubmit = (data: LoginPayload) => {
    loginMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Tên đăng nhập hoặc Email
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            {...register('usernameOrEmail', {
              required: 'Vui lòng nhập tên đăng nhập hoặc email',
            })}
            placeholder="admin@shdcorp.vn"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none transition"
          />
        </div>
        {errors.usernameOrEmail && (
          <p className="text-xs text-red-500 mt-1">{errors.usernameOrEmail.message}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mật khẩu</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="password"
            {...register('password', {
              required: 'Vui lòng nhập mật khẩu',
            })}
            placeholder="••••••••••••"
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-none transition"
          />
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full py-2.5 shadow-lg shadow-blue-900/20"
        isLoading={loginMutation.isPending}
      >
        Đăng nhập vào Hệ thống
      </Button>

      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800">
        <p className="font-semibold mb-0.5">Tài khoản quản trị khởi tạo (Dev Seed):</p>
        <p>Email: <code className="bg-white/80 px-1 py-0.5 rounded font-mono">admin@shdcorp.vn</code></p>
        <p className="mt-0.5">Mật khẩu: <code className="bg-white/80 px-1 py-0.5 rounded font-mono">ChangeMeOnFirstLogin@2026!</code></p>
      </div>
    </form>
  );
};
