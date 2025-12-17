export type InventoryItem = {
    id: string;
    organizationId: string;
    sectionId: string;
    name: string;
    vintage: number | null;
    quantity: number;
    unit: string;
    updatedAt: string;
};
