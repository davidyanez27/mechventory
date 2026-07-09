import { useEffect, useRef } from 'react';
import { ThemeToggle } from '../components/interaction/ThemeToggle';
import { LanguageSwitcher } from '../components/interaction/LanguageSwitcher';
import { UserDropdown } from '../components/form';
import { useUiStore } from '../../store';
import { Menu, MoreHorizontal, X } from '@/UI/helpers';

export const AppHeader = () => {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);
  const isMobileOpen = useUiStore((s) => s.isMobileOpen);
  const isApplicationMenuOpen = useUiStore((s) => s.isApplicationMenuOpen);
  const toggleApplicationMenu = useUiStore((s) => s.toggleApplicationMenu);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) return toggleSidebar();
    toggleMobileSidebar();
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 flex w-full bg-background border-border z-[60] lg:border-b print:hidden">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-border sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="flex items-center justify-center w-10 h-10 text-muted-foreground rounded-lg z-99999 lg:flex lg:h-11 lg:w-11 border-border lg:border [body[data-scroll-locked='1']_&]:lg:border-0"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-muted-foreground rounded-lg z-99999 hover:bg-accent lg:hidden"
            aria-label="Toggle Application Menu"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? 'flex' : 'hidden'
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle isHeader={true} />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
};
