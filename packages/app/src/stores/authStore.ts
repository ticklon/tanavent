
import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true, // Initial loading state is true until Firebase auth check completes
    setUser: (user) => set({ user }),
    setLoading: (isLoading) => set({ isLoading }),
}));
