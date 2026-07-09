import { useUiStore } from '../../store';

export const Backdrop: React.FC = () => {
  const isMobileOpen = useUiStore((s) => s.isMobileOpen);
  const toggleMobileSidebar = useUiStore((s) => s.toggleMobileSidebar);

  if (!isMobileOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black/50 lg:hidden"
      onClick={toggleMobileSidebar}
    />
  );
};
