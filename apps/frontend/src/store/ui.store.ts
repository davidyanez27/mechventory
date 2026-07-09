import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ApiError } from '@/infrastructure/helpers/parse-api-error';

// UI-only concern, so it lives with the store rather than in the shared package.
export type Theme = 'light' | 'dark';

const applyThemeClass = (theme: Theme) => {
  // guard for SSR
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === 'dark');
};

type UiState = {
  // Properties
    theme: Theme;
    isExpanded: boolean;
    isMobile: boolean;
    isMobileOpen: boolean;
    isHovered: boolean;
    activeModal: string | null;
    modalProps: Record<string, unknown>;
    isApplicationMenuOpen: boolean;
    activeItem: string | null;
    openSubmenu: string | null;
    formError: ApiError | null;

  // Getters


  // Actions
  openModal: (name: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  setIsMobile: (value: boolean) => void;
  setIsHovered: (value: boolean) => void;
  setActiveItem: (item: string | null) => void;
  setTheme: (item: Theme) => void;
  setFormError: (error: ApiError | null) => void;
  clearFormError: () => void;
  toggleSubmenu: (item: string) => void;
  toggleApplicationMenu: () => void;
}

export const useUiStore = create<UiState>()(persist((set, get) => ({

  // ---------- initial state ---------- //
    theme: 'light',
    isExpanded:true,
    isMobile: false,
    isMobileOpen: false,
    isHovered:false,
    activeModal: null,
    modalProps: {},
    isApplicationMenuOpen: false,
    activeItem:null,
    openSubmenu:null,
    formError: null,

    // ---------- actions ---------- //
      openModal: (name, props = {}) => set({ activeModal: name, modalProps: props }),
      closeModal: () => set({ activeModal: null, modalProps: {} }),
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeClass(next);
        set({ theme: next });
      },

    toggleSidebar:()=>
      set((state)=>({
        isExpanded: !state.isExpanded
    })),

    toggleMobileSidebar:()=>
      set((state)=>({
        isMobileOpen: !state.isMobileOpen
    })),

    setIsMobile: (value) =>
      set((state) => ({
        isMobile: value,
        isMobileOpen: value ? state.isMobileOpen : false,
    })),

    setIsHovered: (value) => set({ isHovered: value }),
    
    setActiveItem: (item) => set({ activeItem: item }),

    toggleSubmenu:(item: string)=>
      set((state)=>({
        openSubmenu: state.openSubmenu === item ? null : item
    })),

    toggleApplicationMenu:()=>set((state)=>({
      isApplicationMenuOpen: !state.isApplicationMenuOpen
    })),

    setFormError: (error) => set({ formError: error }),
    clearFormError: () => set({ formError: null }),
      setTheme: (theme) => {
        applyThemeClass(theme);
        set({ theme });
      },

    }),{
      name: 'ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state, error) => {
        if (error) return;
        if (state) applyThemeClass(state.theme);
      },
    }
))

