
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { NavigationModule } from '@/config/navigationConfig';

interface NavigationState {
    activeModule: NavigationModule;
    isSecondarySidebarOpen: boolean;

    // Actions
    setActiveModule: (module: NavigationModule) => void;
    toggleSecondarySidebar: () => void;
    setSecondarySidebarOpen: (isOpen: boolean) => void;
}

export const useNavigationStore = create<NavigationState>()(
    persist(
        (set) => ({
            activeModule: 'COMMAND',
            isSecondarySidebarOpen: true,

            setActiveModule: (module) => set({ activeModule: module }),
            toggleSecondarySidebar: () => set((state) => ({ isSecondarySidebarOpen: !state.isSecondarySidebarOpen })),
            setSecondarySidebarOpen: (isOpen) => set({ isSecondarySidebarOpen: isOpen }),
        }),
        {
            name: 'navigation-storage',
        }
    )
);
