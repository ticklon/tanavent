import { create } from 'zustand';
import { getApiClient } from '../lib/client';
import i18n from '../lib/i18n';

type ViewState = {
    view: 'dashboard' | 'inventory' | 'purchasing' | 'stocktaking' | 'settings';
    subView?: string;
    itemId?: string;
    filters?: Record<string, unknown>;
};

type ViewStore = {
    activeOrganizationId: string | null;
    activeSectionId: string | null;
    language: string;
    lastViewState: ViewState;

    // Actions
    initialize: () => Promise<void>;
    updateCtx: (orgId: string, sectionId: string) => Promise<void>;
    changeView: (state: ViewState) => void;
    openDetail: (itemId: string) => void;
    closeDetail: () => void;
    changeLanguage: (lang: string) => Promise<void>;
};

export const useViewStore = create<ViewStore>((set, get) => ({
    activeOrganizationId: null,
    activeSectionId: null,
    language: 'ja',
    lastViewState: { view: 'dashboard' },

    initialize: async () => {
        try {
            const client = await getApiClient();
            const res = await client.api.me.state.$get();
            if (!res.ok) return;

            const data = await res.json();

            // Update local state
            set({
                activeOrganizationId: data.activeOrganizationId,
                activeSectionId: data.activeSectionId,
                language: data.language || 'ja',
                lastViewState: (data.lastViewState as ViewState) || { view: 'dashboard' },
            });

            // Apply language immediately
            if (data.language && data.language !== i18n.language) {
                await i18n.changeLanguage(data.language);
            }
        } catch (e) {
            console.error('Failed to init state', e);
        }
    },

    updateCtx: async (orgId, sectionId) => {
        set({ activeOrganizationId: orgId, activeSectionId: sectionId });
        await syncState(get());
    },

    changeView: (state) => {
        set({ lastViewState: state });
        // Debounce this in real app? For now, sync immediately
        syncState(get());
    },

    openDetail: (itemId: string) => {
        const current = get().lastViewState;
        set({ lastViewState: { ...current, itemId } });
        syncState(get());
    },

    closeDetail: () => {
        const current = get().lastViewState;
        // Remove itemId from state
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { itemId, ...rest } = current;
        set({ lastViewState: rest });
        syncState(get());
    },

    changeLanguage: async (lang) => {
        set({ language: lang });
        await i18n.changeLanguage(lang);
        await syncState(get());
    },
}));

async function syncState(state: ViewStore) {
    try {
        const client = await getApiClient();
        await client.api.me.state.$post({
            json: {
                activeOrganizationId: state.activeOrganizationId,
                activeSectionId: state.activeSectionId,
                language: state.language,
                lastViewState: state.lastViewState,
            }
        });
    } catch (e) {
        console.error('Failed to sync state', e);
    }
}