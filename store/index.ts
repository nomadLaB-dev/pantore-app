import { create } from 'zustand';
import { User } from '@/types';

interface AppState {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    isLoadingAuth: boolean;
    setIsLoadingAuth: (loading: boolean) => void;
    sidebarOpen: boolean;
    toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentUser: null,
    setCurrentUser: (user) => set({ currentUser: user }),
    isLoadingAuth: true,
    setIsLoadingAuth: (loading) => set({ isLoadingAuth: loading }),
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
