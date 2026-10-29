import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void; icon?: React.ReactNode };
  className?: string;
}) {
  return (
    <Card className={cn('border-dashed border-border/60 p-12 text-center bg-transparent', className)}>
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/70 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
      {action && (
        <Button onClick={action.onClick} className="mt-5" size="sm">
          {action.icon && <span className="mr-1.5">{action.icon}</span>}
          {action.label}
        </Button>
      )}
    </Card>
  );
}
