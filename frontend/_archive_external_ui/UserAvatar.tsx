import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function UserAvatar({
  name,
  src,
  avatar,
  size,
  className,
  fallbackClassName,
}: {
  name: string;
  src?: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  fallbackClassName?: string;
}) {
  const actualSrc = src || avatar;
  const parts = name.trim().split(' ');
  const initials = parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (name.slice(0, 2) || '?').toUpperCase();

  const sizeMap = {
    xs: 'h-5 w-5 text-[9px]',
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-xs',
    lg: 'h-10 w-10 text-sm',
  };

  return (
    <Avatar className={cn(size ? sizeMap[size] : 'h-8 w-8 text-xs font-semibold', className)}>
      {actualSrc && <AvatarImage src={actualSrc} alt={name} />}
      <AvatarFallback className={cn('bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold', fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
