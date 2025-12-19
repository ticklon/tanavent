import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../lib/i18n';

type ViewStore = {
    activeOrganizationId: string | null;
    language: string;
    selectedItemId: string | null;
    
    // Actions
    setActiveOrganizationId: (orgId: string | null) => void;
    changeLanguage: (lang: string) => Promise<void>;
    openDetail: (itemId: string) => void;
    closeDetail: () => void;
};

export const useViewStore = create<ViewStore>()(
    persist(
        (set) => ({
            activeOrganizationId: null,
            language: 'ja',
            selectedItemId: null,

            setActiveOrganizationId: (orgId) => {
                set({ activeOrganizationId: orgId });
            },

            changeLanguage: async (lang) => {
                set({ language: lang });
                await i18n.changeLanguage(lang);
            },

            openDetail: (itemId) => set({ selectedItemId: itemId }),
            closeDetail: () => set({ selectedItemId: null }),
        }),
        {
            name: 'tanavent-storage',
            partialize: (state) => ({ 
                activeOrganizationId: state.activeOrganizationId,
                language: state.language
            }),
        }
    )
);
