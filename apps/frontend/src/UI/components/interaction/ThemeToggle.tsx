import { useUiStore } from '../../../store';
import { Moon, Sun } from '@/UI/helpers';

type ThemeToggleProps = { isHeader: boolean };

export const ThemeToggle = ({ isHeader }: ThemeToggleProps) => {
  const toggleTheme = useUiStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      className={`items-center justify-center ${
        isHeader
          ? 'relative flex transition-colors bg-background border border-border rounded-full text-muted-foreground h-11 w-11 hover:bg-accent hover:text-foreground'
          : 'inline-flex text-white dark:text-black transition-colors rounded-full size-14 bg-brand-500 hover:bg-brand-600'
      }`}
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </button>
  );
};
