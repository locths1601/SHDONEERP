import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button as ShadcnButton, ButtonProps as ShadcnButtonProps, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'default' | 'destructive' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'default' | 'icon' | 'xs';
  icon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  leftIcon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  rightIcon?: React.ReactNode | React.ComponentType<{ className?: string }>;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'default',
      icon,
      iconPosition = 'left',
      leftIcon,
      rightIcon,
      loading = false,
      disabled,
      className = '',
      asChild = false,
      ...props
    },
    ref
  ) => {
    // Map legacy variants
    let mappedVariant: ShadcnButtonProps['variant'] = 'default';
    if (variant === 'primary' || variant === 'default') mappedVariant = 'default';
    else if (variant === 'danger' || variant === 'destructive') mappedVariant = 'destructive';
    else if (variant === 'secondary') mappedVariant = 'secondary';
    else if (variant === 'outline') mappedVariant = 'outline';
    else if (variant === 'ghost') mappedVariant = 'ghost';
    else if (variant === 'link') mappedVariant = 'link';

    // Map legacy sizes
    let mappedSize: ShadcnButtonProps['size'] = 'default';
    if (size === 'sm' || size === 'xs') mappedSize = 'sm';
    else if (size === 'md' || size === 'default') mappedSize = 'default';
    else if (size === 'lg') mappedSize = 'lg';
    else if (size === 'icon') mappedSize = 'icon';

    const renderIcon = (iconInput?: React.ReactNode | React.ComponentType<{ className?: string }>) => {
      if (!iconInput) return null;
      if (React.isValidElement(iconInput)) return iconInput;
      if (
        typeof iconInput === 'function' ||
        (typeof iconInput === 'object' && iconInput !== null && '$$typeof' in (iconInput as any))
      ) {
        const IconComponent = iconInput as React.ComponentType<{ className?: string }>;
        return <IconComponent className="w-3.5 h-3.5 shrink-0" />;
      }
      return iconInput as React.ReactNode;
    };

    const resolvedLeft = leftIcon ?? (iconPosition === 'left' ? icon : undefined);
    const resolvedRight = rightIcon ?? (iconPosition === 'right' ? icon : undefined);

    // When asChild is true, the underlying ShadcnButton renders a Radix Slot
    // which requires exactly ONE React element child. Our loading-spinner and
    // left/right-icon decorations produce multiple siblings, so we must bypass
    // them and forward children as-is. Consumers who need a loading spinner or
    // an icon should include it inside their single child (e.g. inside <Link>).
    if (asChild) {
      return (
        <ShadcnButton
          ref={ref}
          variant={mappedVariant}
          size={mappedSize}
          asChild
          disabled={disabled || loading}
          className={cn(className)}
          {...props}
        >
          {children}
        </ShadcnButton>
      );
    }

    return (
      <ShadcnButton
        ref={ref}
        variant={mappedVariant}
        size={mappedSize}
        asChild={asChild}
        disabled={disabled || loading}
        className={cn(className)}
        {...props}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mr-1.5" />}
        {!loading && resolvedLeft && (
          <span className="shrink-0 inline-flex mr-1.5">{renderIcon(resolvedLeft)}</span>
        )}
        {children}
        {!loading && resolvedRight && (
          <span className="shrink-0 inline-flex ml-1.5">{renderIcon(resolvedRight)}</span>
        )}
      </ShadcnButton>
    );
  }
);
Button.displayName = 'Button';
export { buttonVariants };
export default Button;
