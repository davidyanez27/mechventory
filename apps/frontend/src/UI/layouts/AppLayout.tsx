import { Outlet } from '@tanstack/react-router';
import { Toaster } from 'sonner';
import { AppHeader, AppSidebar, Backdrop } from './index';
import { useUiStore } from '../../store';

export const AppLayout: React.FC = () => {
  const isExpanded = useUiStore((s) => s.isExpanded);
  const isHovered = useUiStore((s) => s.isHovered);
  const isMobileOpen = useUiStore((s) => s.isMobileOpen);

  return (
    <div className="min-h-screen xl:flex">
      <Toaster position="top-right" richColors closeButton />
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]'} ${isMobileOpen ? 'ml-0' : ''} print:ml-0`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
