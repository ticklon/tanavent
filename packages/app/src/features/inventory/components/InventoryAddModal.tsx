import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogPanel, DialogTitle, DialogBackdrop } from '@headlessui/react'
import { X, Loader2 } from 'lucide-react'
import { useInventoryMutation } from '../api/useInventoryHooks'

type Props = {
    isOpen: boolean;
    onClose: () => void;
    sectionId?: string;
}

export const InventoryAddModal = ({ isOpen, onClose, sectionId }: Props) => {
    const { t } = useTranslation(['common', 'inventory']);
    const { createItem } = useInventoryMutation(sectionId);

    const [name, setName] = useState('');
    const [vintage, setVintage] = useState<string>('');
    const [quantity, setQuantity] = useState('0');
    const [unit, setUnit] = useState('btl');

    const isPending = createItem.isPending;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createItem.mutate({
            name,
            vintage: vintage ? parseInt(vintage) : null,
            quantity: parseInt(quantity) || 0,
            unit
        }, {
            onSuccess: () => {
                resetForm();
                onClose();
            }
        });
    };

    const resetForm = () => {
        setName('');
        setVintage('');
        setQuantity('0');
        setUnit('btl');
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            className="relative z-50"
        >
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-black/30 transition duration-300 data-[closed]:opacity-0"
            />

            <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                <DialogPanel
                    transition
                    className="max-w-md w-full space-y-4 border bg-white p-6 rounded-2xl shadow-xl transition duration-300 data-[closed]:scale-95 data-[closed]:opacity-0"
                >
                    <div className="flex justify-between items-start">
                        <DialogTitle className="font-bold text-lg">
                            {t('common:add_item')}
                        </DialogTitle>
                        <button
                            onClick={onClose}
                            className="p-1 text-text-muted hover:bg-gray-100 rounded-full"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-bold text-text-muted mb-1">
                                {t('inventory:list.name')}
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-tanavent-blue focus:border-transparent outline-none"
                                placeholder="e.g. Chateau Margaux"
                            />
                        </div>

                        {/* Vintage */}
                        <div>
                            <label className="block text-sm font-bold text-text-muted mb-1">
                                {t('inventory:list.vintage')}
                            </label>
                            <input
                                type="number"
                                value={vintage}
                                onChange={(e) => setVintage(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-tanavent-blue focus:border-transparent outline-none"
                                placeholder="e.g. 2015"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Quantity */}
                            <div>
                                <label className="block text-sm font-bold text-text-muted mb-1">
                                    {t('inventory:list.stock')}
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-tanavent-blue focus:border-transparent outline-none"
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="block text-sm font-bold text-text-muted mb-1">
                                    {t('inventory:list.unit')}
                                </label>
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-tanavent-blue focus:border-transparent outline-none bg-white"
                                >
                                    <option value="btl">Bottle</option>
                                    <option value="gls">Glass</option>
                                    <option value="case">Case</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded bg-gray-100 font-bold hover:bg-gray-200"
                            >
                                {t('common:cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-6 py-2 rounded bg-tanavent-blue text-white font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isPending && <Loader2 className="animate-spin" size={16} />}
                                {t('common:save')}
                            </button>
                        </div>
                    </form>
                </DialogPanel>
            </div>
        </Dialog>
    )
}
