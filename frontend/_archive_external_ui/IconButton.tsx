import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode | React.ComponentType<{ className?: string }>;
  label: string;
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  loading?: boolean;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'default',
  loading = false,
  disabled,
  className,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    default: 'h-9 w-9 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const renderIcon = (iconInput: React.ReactNode | React.ComponentType<{ className?: string }>) => {
    if (!iconInput) return null;
    if (React.isValidElement(iconInput)) return iconInput;
    if (
      typeof iconInput === 'function' ||
      (typeof iconInput === 'object' && iconInput !== null && '$$typeof' in (iconInput as any))
    ) {
      const IconComponent = iconInput as React.ComponentType<{ className?: string }>;
      return <IconComponent className="h-4 w-4 shrink-0" />;
    }
    return iconInput as React.ReactNode;
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon"
          disabled={disabled || loading}
          className={cn(
            'group inline-flex items-center justify-center transition-all duration-200',
            sizeClasses[size],
            className
          )}
          aria-label={label}
          {...props}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : renderIcon(icon)}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}
