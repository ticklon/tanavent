import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../../../lib/client';
import { useViewStore } from '../../../stores/viewStore';

export type Section = {
    id: string;
    organizationId: string;
    name: string;
    settings?: Record<string, unknown>;
};

export const sectionKeys = {
    all: ['sections'] as const,
    list: (orgId: string | null) => [...sectionKeys.all, 'list', orgId] as const,
};

export const useSectionList = () => {
    const activeOrganizationId = useViewStore((state) => state.activeOrganizationId);

    return useQuery({
        queryKey: sectionKeys.list(activeOrganizationId),
        queryFn: async () => {
            if (!activeOrganizationId) return [];
            const client = await getApiClient();
            // Using 'any' to bypass strict type check for now, as types might need regeneration
            const res = await (client.api.organizations[':orgId'].sections as any).$get({
                param: { orgId: activeOrganizationId }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch sections');
            }

            return res.json() as Promise<Section[]>;
        },
        enabled: !!activeOrganizationId,
    });
};

export const useSectionMutation = () => {
    const queryClient = useQueryClient();
    const activeOrganizationId = useViewStore((state) => state.activeOrganizationId);

    // Create
    const createSection = useMutation({
        mutationFn: async (name: string) => {
            if (!activeOrganizationId) throw new Error('No active organization');

            const client = await getApiClient();
            const res = await (client.api.organizations[':orgId'].sections as any).$post({
                param: { orgId: activeOrganizationId },
                json: { name }
            });

            if (!res.ok) throw new Error('Failed to create section');
            return res.json() as Promise<Section>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sectionKeys.list(activeOrganizationId) });
        }
    });

    // Update
    const updateSection = useMutation({
        mutationFn: async ({ id, name }: { id: string; name: string }) => {
            if (!activeOrganizationId) throw new Error('No active organization');

            const client = await getApiClient();
            const res = await (client.api.organizations[':orgId'].sections[':sectionId'] as any).$put({
                param: { orgId: activeOrganizationId, sectionId: id },
                json: { name }
            });

            if (!res.ok) throw new Error('Failed to update section');
            return res.json() as Promise<Section>;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sectionKeys.list(activeOrganizationId) });
        }
    });

    // Delete
    const deleteSection = useMutation({
        mutationFn: async (id: string) => {
            if (!activeOrganizationId) throw new Error('No active organization');

            const client = await getApiClient();
            const res = await (client.api.organizations[':orgId'].sections[':sectionId'] as any).$delete({
                param: { orgId: activeOrganizationId, sectionId: id }
            });

            if (!res.ok) throw new Error('Failed to delete section');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sectionKeys.list(activeOrganizationId) });
        }
    });

    return { createSection, updateSection, deleteSection };
};
