import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react'
import { Trash2, Plus, Minus, X } from 'lucide-react'
import { useViewStore } from '../../../stores/viewStore'
import { useInventoryItem, useInventoryMutation } from '../api/useInventoryHooks'

export const InventoryDetailModal = () => {
    const { t } = useTranslation(['common', 'inventory']);
    const { selectedItemId, closeDetail } = useViewStore();
    const itemId = selectedItemId;
    // const { updateItem, deleteItem } = useInventoryMutation(); // Moved to Form

    // Local state for delete confirmation
    // const [isDeleting, setIsDeleting] = useState(false); // Moved to Form
    // Note: 'isOpen' is derived from whether 'itemId' exists in the state
    const isOpen = !!itemId;

    const { data: item, isLoading } = useInventoryItem(itemId);

    return (
        <Dialog
            open={isOpen}
            onClose={closeDetail}
            className="relative z-50"
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/30 transition duration-300 data-[closed]:opacity-0"
            />

            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="max-w-md w-full space-y-4 border bg-white p-6 rounded-2xl shadow-xl transition duration-300 data-[closed]:scale-95 data-[closed]:opacity-0 overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <DialogTitle className="font-bold text-lg pr-8">
                            {isLoading ? t('common:loading') : item?.name || 'Item Detail'}
                        </DialogTitle>
                        <button
                            onClick={closeDetail}
                            className="absolute top-4 right-4 p-2 text-text-muted hover:bg-gray-100 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="text-sm text-text-muted">
                        ID: {itemId}
                    </div>

                    {item && (
                        <InventoryDetailForm
                            item={item}
                            itemId={itemId!}
                            onClose={closeDetail}
                        />
                    )}
                </DialogPanel>
            </div>
        </Dialog>
    )
}


import { InventoryItem } from '../types'

// Removed manual type definition here

type FormProps = {
    item: InventoryItem;
    itemId: string;
    onClose: () => void;
};

const InventoryDetailForm = ({ item, itemId, onClose }: FormProps) => {
    const { t } = useTranslation(['common', 'inventory']);
    const { updateItem, deleteItem } = useInventoryMutation();
    const [isDeleting, setIsDeleting] = useState(false);

    // Initial state from prop
    const [editingQuantity, setEditingQuantity] = useState<number>(item.quantity);

    // If item updates from background, we might want to sync,
    // but for editing flow, usually we stick to local unless saved.
    // However, if we want to support "reset on re-open", the parent renders this component fresh when item changes (if we keyed it)
    // or we just assume initial render is enough.
    // If we receive new data via WebSocket or refetch, should we overwrite user input? Usually no.
    // So useState(item.quantity) only on mount is actually safer for avoiding overwrite interactions.
    // But if user saves, we want to update.

    // Update local state if the saved quantity changes (e.g. after save)
    // We can use a key on this component from the parent to force remount on item change,
    // OR we just assume this component handles the edit session.

    // Let's rely on parent passing fresh data if it changes significantly,
    // but here, we just want to avoid the lint error.

    const hasChanges = editingQuantity !== item.quantity;

    const handleIncrement = () => {
        setEditingQuantity(prev => prev + 1);
    };

    const handleDecrement = () => {
        if (editingQuantity <= 0) return;
        setEditingQuantity(prev => prev - 1);
    };

    const handleSave = () => {
        updateItem.mutate({ id: itemId, data: { quantity: editingQuantity } }, {
            onSuccess: () => {
                // Toast logic
            }
        });
    };

    const handleDelete = async () => {
        try {
            await deleteItem.mutateAsync(itemId);
            onClose();
            setIsDeleting(false);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <>
            {!isDeleting && (
                <div className="space-y-6 py-4">
                    {/* Vintage */}
                    <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-text-muted">{t('inventory:list.vintage')}</span>
                        <span className="font-bold text-tanavent-navy">{item.vintage || 'NV'}</span>
                    </div>

                    {/* Quantity Control */}
                    <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-text-muted">{t('inventory:list.stock')}</span>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleDecrement}
                                className="p-2 rounded-full border border-border hover:bg-gray-50 active:scale-95 transition"
                                disabled={editingQuantity <= 0}
                            >
                                <Minus size={16} />
                            </button>
                            <span className={`font-bold text-2xl min-w-[3ch] text-center ${hasChanges ? 'text-tanavent-warning' : 'text-tanavent-blue'}`}>
                                {editingQuantity}
                            </span>
                            <button
                                onClick={handleIncrement}
                                className="p-2 rounded-full border border-border hover:bg-gray-50 active:scale-95 transition"
                            >
                                <Plus size={16} />
                            </button>
                            <span className="text-sm text-text-muted font-normal">{item.unit}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isDeleting && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
                    <p className="text-tanavent-error font-bold mb-2">{t('inventory:delete.confirmTitle')}</p>
                    <p className="text-sm text-text-muted mb-4">{t('inventory:delete.confirmDescription')}</p>
                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => setIsDeleting(false)}
                            className="px-4 py-2 text-sm bg-white border border-border rounded font-medium"
                        >
                            {t('common:cancel')}
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 text-sm bg-tanavent-error text-white rounded font-bold"
                        >
                            {t('common:delete')}
                        </button>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            {!isDeleting && (
                <div className="flex justify-between pt-4 mt-auto">
                    <button
                        onClick={() => setIsDeleting(true)}
                        className="p-2 text-tanavent-error hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>

                    <div className="flex gap-2">
                        {hasChanges ? (
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 rounded-lg bg-tanavent-blue text-white font-bold hover:opacity-90 active:scale-95 transition shadow-lg animate-pulse"
                            >
                                {t('common:save')}
                            </button>
                        ) : (
                            <button className="px-6 py-2 rounded-lg bg-white border border-border text-text-main font-bold hover:bg-gray-50 transition">
                                {t('common:edit')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};
