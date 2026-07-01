import { create } from 'zustand';
import { User, Branch, SpecimenRole } from '@/types';

interface AppState {
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;
    isLoadingAuth: boolean;
    setIsLoadingAuth: (loading: boolean) => void;
    sidebarOpen: boolean;
    toggleSidebar: () => void;
    branches: Branch[];
    setBranches: (branches: Branch[]) => void;
    specimenRole: SpecimenRole | null;
    setSpecimenRole: (role: SpecimenRole | null) => void;
    branchId: string | null;
    setBranchId: (branchId: string | null) => void;
    userName: string | null;
    setUserName: (name: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    currentUser: null,
    setCurrentUser: (user) => set({ currentUser: user }),
    isLoadingAuth: true,
    setIsLoadingAuth: (loading) => set({ isLoadingAuth: loading }),
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    branches: [],
    setBranches: (branches) => set({ branches }),
    specimenRole: null,
    setSpecimenRole: (role) => set({ specimenRole: role }),
    branchId: null,
    setBranchId: (branchId) => set({ branchId }),
    userName: null,
    setUserName: (name) => set({ userName: name }),
}));
