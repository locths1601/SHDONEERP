import { Badge } from '@/components/ui/badge';
import { Users2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function GroupBadge({ group }: { group: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant="outline"
          className="gap-1 font-medium bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800"
        >
          <Users2 className="h-3 w-3" />
          {group}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>Member of group: {group}</TooltipContent>
    </Tooltip>
  );
}
