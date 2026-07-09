import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useUiStore } from '../../store';
import { ChevronDown, Ellipsis } from '@/UI/helpers';
import { useNavItems } from '../data/NavItems';

export const AppSidebar = () => {
  const isExpanded   = useUiStore((s) => s.isExpanded);
  const isHovered    = useUiStore((s) => s.isHovered);
  const isMobileOpen = useUiStore((s) => s.isMobileOpen);
  const setIsHovered = useUiStore((s) => s.setIsHovered);

  const pathname  = useRouterState({ select: (s) => s.location.pathname });
  const showLabel = isExpanded || isHovered || isMobileOpen;
  const navItems  = useNavItems();

  // Initialise open groups from the current route so the active section
  // is always expanded on first render.
  const groupKey = (item: { subItems?: { path: string }[] }) =>
    item.subItems?.[0]?.path ?? '';

  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    navItems
      .filter((item) =>
        item.subItems?.some(
          (sub) => pathname === sub.path || pathname.startsWith(sub.path + '/'),
        ),
      )
      .map(groupKey),
  );

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-background text-foreground h-full transition-all duration-300 ease-in-out z-50 border-r border-border print:hidden
        ${isExpanded || isMobileOpen ? 'w-[290px]' : isHovered ? 'w-[290px]' : 'w-[90px]'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'}`}>
        <Link to="/">
          {showLabel ? (
            <span className="text-foreground font-semibold text-lg">Mechventory</span>
          ) : (
            <span className="text-foreground font-semibold text-lg">M</span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex flex-col h-full overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-0.5">
            {showLabel && (
              <h2 className="mb-3 text-xs uppercase leading-5 text-muted-foreground">
                Menu
              </h2>
            )}
            {!showLabel && (
              <div className="flex justify-center mb-4">
                <Ellipsis className="size-5 text-muted-foreground" />
              </div>
            )}

            {navItems.map((item) => {
              // ── Collapsible group (item has subItems) ───────────────────
              if (item.subItems && item.subItems.length > 0) {
                const key = groupKey(item);
                const isOpen = openGroups.includes(key);
                const isGroupActive = item.subItems.some(
                  (sub) =>
                    pathname === sub.path ||
                    pathname.startsWith(sub.path + '/'),
                );

                return (
                  <div key={key}>
                    <button
                      type="button"
                      onClick={() => showLabel && toggleGroup(key)}
                      className={`flex items-center w-full gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                        ${isGroupActive ? 'text-primary bg-accent' : 'text-foreground hover:bg-accent'}
                        ${!showLabel ? 'justify-center' : 'justify-between'}`}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {showLabel && item.name}
                      </span>
                      {showLabel && (
                        <ChevronDown
                          className={`size-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      )}
                    </button>

                    {/* Sub-items */}
                    {isOpen && showLabel && (
                      <div className="mt-0.5 ml-4 pl-3 border-l border-border flex flex-col gap-0.5 py-1">
                        {item.subItems.map((sub) => {
                          const isSubActive = pathname === sub.path;
                          return (
                            <Link
                              key={sub.path}
                              to={sub.path}
                              className={`block px-3 py-1.5 rounded-lg text-sm transition-colors
                                ${isSubActive
                                  ? 'text-primary font-medium bg-accent'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                }`}
                            >
                              {sub.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // ── Flat link ────────────────────────────────────────────────
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive ? 'text-primary bg-accent' : 'text-foreground hover:bg-accent'}
                    ${!showLabel ? 'justify-center' : ''}`}
                >
                  {showLabel ? (
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.name}
                    </span>
                  ) : (
                    <span>{item.icon}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </aside>
  );
};
