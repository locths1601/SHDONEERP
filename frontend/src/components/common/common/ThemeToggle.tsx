import { useState } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThemeCustomizerModal } from './ThemeCustomizerModal';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCustomizerOpen(true)}
              aria-label="Tuỳ chỉnh giao diện"
              style={{ color: 'var(--sidebar-muted, #94a3b8)' }}
              className="hover:text-[var(--sidebar-hover-fg)] hover:bg-[var(--sidebar-hover-bg)]"
            >
              <Palette className="h-4 w-4 text-blue-500 dark:text-sky-400" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Tuỳ chỉnh giao diện & màu sắc
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              style={{ color: 'var(--sidebar-muted, #94a3b8)' }}
              className="hover:text-[var(--sidebar-hover-fg)] hover:bg-[var(--sidebar-hover-bg)]"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {theme === 'light' ? 'Chuyển sang nền tối' : 'Chuyển sang nền sáng'}
          </TooltipContent>
        </Tooltip>
      </div>

      <ThemeCustomizerModal
        open={isCustomizerOpen}
        onOpenChange={setIsCustomizerOpen}
      />
    </>
  );
}
