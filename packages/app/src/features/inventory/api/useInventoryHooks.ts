import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiClient } from '../../../lib/client'; // Adjust path if needed
import { useViewStore } from '../../../stores/viewStore';
import { InventoryItem } from '../types';

// Keys
export const inventoryKeys = {
    all: ['inventory'] as const,
    list: (sectionId: string | null) => [...inventoryKeys.all, 'list', sectionId] as const,
    item: (id: string | undefined) => [...inventoryKeys.all, 'item', id] as const,
};

export const useInventoryItem = (id: string | undefined) => {
    return useQuery({
        queryKey: inventoryKeys.item(id),
        queryFn: async () => {
            if (!id) return null;
            const client = await getApiClient();
            const res = await client.api.inventory[':id'].$get({
                param: { id }
            });
            if (!res.ok) {
                throw new Error('Failed to fetch item');
            }
            return res.json() as Promise<InventoryItem>;
        },
        enabled: !!id,
    });
};

// Hook
export const useInventoryQuery = (sectionId?: string) => {
    return useQuery({
        queryKey: inventoryKeys.list(sectionId || null),
        queryFn: async () => {
            if (!sectionId) return { items: [] };

            const client = await getApiClient();
            const res = await client.api.inventory.$get({
                query: { sectionId }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch inventory');
            }

            return res.json() as Promise<{ items: InventoryItem[] }>;
        },
        enabled: !!sectionId,
    });
};

export const useInventoryMutation = (sectionId?: string) => {
    const queryClient = useQueryClient();
    const activeOrganizationId = useViewStore((state) => state.activeOrganizationId);

    // Create
    const createItem = useMutation({
        mutationFn: async (newItem: { name: string; quantity: number; unit: string; vintage: number | null }) => {
            if (!activeOrganizationId || !sectionId) throw new Error('No context');

            const client = await getApiClient();
            const res = await client.api.inventory.$post({
                json: {
                    ...newItem,
                    organizationId: activeOrganizationId,
                    sectionId
                }
            });
            if (!res.ok) throw new Error('Failed to create item');
            return res.json() as Promise<InventoryItem>;
        },
        onMutate: async (newItem) => {
            await queryClient.cancelQueries({ queryKey: inventoryKeys.list(sectionId || null) });
            const previousItems = queryClient.getQueryData<{ items: InventoryItem[] }>(inventoryKeys.list(sectionId || null));

            // Optimistic update
            queryClient.setQueryData(inventoryKeys.list(sectionId || null), (old: { items: InventoryItem[] } | undefined) => {
                const optimisticItem = {
                    id: 'temp-' + Date.now(),
                    ...newItem,
                    organizationId: activeOrganizationId || '',
                    sectionId: sectionId || '',
                    updatedAt: new Date().toISOString(),
                };
                return {
                    items: old?.items ? [optimisticItem, ...old.items] : [optimisticItem]
                };
            });

            return { previousItems };
        },
        onError: (_err, _newItem, context: { previousItems?: { items: InventoryItem[] } } | undefined) => {
            if (context?.previousItems) {
                queryClient.setQueryData(inventoryKeys.list(sectionId || null), context.previousItems);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.list(sectionId || null) });
        }
    });

    // Update
    const updateItem = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: { name?: string; quantity?: number; vintage?: number | null; unit?: string } }) => {
            const client = await getApiClient();
            const res = await client.api.inventory[':id'].$put({
                param: { id },
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                json: data as any
            });
            if (!res.ok) throw new Error('Failed to update item');
            return res.json();
        },
        onMutate: async ({ id, data }) => {
            // Cancel list and item queries
            await queryClient.cancelQueries({ queryKey: inventoryKeys.list(sectionId || null) });
            await queryClient.cancelQueries({ queryKey: inventoryKeys.item(id) });

            const previousList = queryClient.getQueryData<{ items: InventoryItem[] }>(inventoryKeys.list(sectionId || null));
            const previousItem = queryClient.getQueryData<InventoryItem>(inventoryKeys.item(id));

            // Optimistic update for List
            queryClient.setQueryData(inventoryKeys.list(sectionId || null), (old: { items: InventoryItem[] } | undefined) => {
                if (!old?.items) return old;
                return {
                    items: old.items.map((item) =>
                        item.id === id ? { ...item, ...data } : item
                    )
                };
            });

            // Optimistic update for Detail
            queryClient.setQueryData(inventoryKeys.item(id), (old: InventoryItem | undefined) => {
                if (!old) return old;
                return { ...old, ...data };
            });

            return { previousList, previousItem };
        },
        onError: (_err, variables, context: { previousList?: { items: InventoryItem[] }, previousItem?: InventoryItem } | undefined) => {
            if (context?.previousList) {
                queryClient.setQueryData(inventoryKeys.list(sectionId || null), context.previousList);
            }
            if (context?.previousItem) {
                queryClient.setQueryData(inventoryKeys.item(variables.id), context.previousItem);
            }
        },
        onSettled: (_data, _error, variables) => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.list(sectionId || null) });
            queryClient.invalidateQueries({ queryKey: inventoryKeys.item(variables.id) });
        }
    });

    // Delete
    const deleteItem = useMutation({
        mutationFn: async (id: string) => {
            const client = await getApiClient();
            const res = await client.api.inventory[':id'].$delete({
                param: { id }
            });
            if (!res.ok) throw new Error('Failed to delete item');
            return res.json();
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: inventoryKeys.list(sectionId || null) });
            const previousList = queryClient.getQueryData<{ items: InventoryItem[] }>(inventoryKeys.list(sectionId || null));

            queryClient.setQueryData(inventoryKeys.list(sectionId || null), (old: { items: InventoryItem[] } | undefined) => {
                if (!old?.items) return old;
                return {
                    items: old.items.filter((item) => item.id !== id)
                };
            });

            return { previousList };
        },
        onError: (_err, _id, context: { previousList?: { items: InventoryItem[] } } | undefined) => {
            if (context?.previousList) {
                queryClient.setQueryData(inventoryKeys.list(sectionId || null), context.previousList);
            }
        },

        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: inventoryKeys.list(sectionId || null) });
        }
    });

    return { createItem, updateItem, deleteItem };
};