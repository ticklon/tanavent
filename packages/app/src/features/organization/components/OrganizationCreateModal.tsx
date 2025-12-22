
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { RadioGroup, Radio, Label, Description } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, X } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useViewStore } from '../../../stores/viewStore';
import { createAuthClient } from '../../../lib/client';

interface OrganizationCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PLANS = [
    { id: 'free', key: 'free' },
    { id: 'pro', key: 'pro', disabled: true },
    { id: 'unlimited', key: 'unlimited', disabled: true },
];

export const OrganizationCreateModal = ({ isOpen, onClose }: OrganizationCreateModalProps) => {
    const { t } = useTranslation(['organization', 'common']);
    const { user } = useAuthStore();
    const { setActiveOrganizationId } = useViewStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [name, setName] = useState('');
    const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setName('');
            setError(null);
            setIsCreating(false);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!user || !name.trim()) return;
        setIsCreating(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const client = createAuthClient(token);
            const res = await client.api.organizations.$post({
                json: { name }
            });

            if (res.ok) {
                const newOrg = await res.json();
                
                // 1. Invalidate cache to fetch the latest organization list including the new one
                await queryClient.invalidateQueries({ queryKey: ['organizations'] });
                
                // 2. Set Active ID and Navigate
                setActiveOrganizationId(newOrg.id);
                navigate('/');
                onClose();
            } else {
                setError(t('settings:error_create'));
            }
        } catch (err) {
            console.error(err);
            setError('Failed to create organization');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                {/* Backdrop */}
                <div 
                    className="fixed inset-0 bg-tanavent-navy/50 backdrop-blur-[2px] transition-opacity" 
                    onClick={onClose}
                />

                {/* Panel */}
                <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-surface-card p-6 text-left align-middle shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-tanavent-navy">
                            {t('organization:modal.title')}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-black/5 text-text-muted transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* Name Input */}
                        <div>
                            <label htmlFor="orgName" className="block text-sm font-medium text-text-main mb-2">
                                {t('organization:label.name')}
                            </label>
                            <input
                                type="text"
                                id="orgName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('organization:modal.name_placeholder')}
                                className="w-full h-12 px-4 rounded-lg border border-border bg-white text-base focus:ring-2 focus:ring-tanavent-blue focus:border-transparent outline-none transition-shadow"
                                autoFocus
                            />
                        </div>

                        {/* Plan Selection */}
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-3">
                                {t('organization:modal.plan_label')}
                            </label>
                            <RadioGroup value={selectedPlan} onChange={setSelectedPlan} className="space-y-3">
                                {PLANS.map((plan) => (
                                    <Radio
                                        key={plan.id}
                                        value={plan}
                                        disabled={plan.disabled}
                                        className={({ checked, disabled }) =>
                                            `relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none transition-colors
                                            ${checked ? 'bg-tanavent-blue-light border-tanavent-blue ring-1 ring-tanavent-blue' : 'bg-white border-border'}
                                            ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:border-tanavent-blue/50'}
                                            `
                                        }
                                    >
                                        {({ checked, disabled }) => (
                                            <>
                                                <div className="flex w-full items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="text-sm">
                                                            <Label as="p" className={`font-bold ${checked ? 'text-tanavent-navy' : 'text-text-main'}`}>
                                                                {t(`organization:plan.${plan.key}.name`)}
                                                            </Label>
                                                            <Description as="span" className={`inline text-xs ${checked ? 'text-tanavent-blue' : 'text-text-muted'}`}>
                                                                {t(`organization:plan.${plan.key}.desc`)}
                                                            </Description>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                            <div className="text-sm font-mono font-medium text-text-main">
                                                            {t(`organization:plan.${plan.key}.price`)}
                                                        </div>
                                                        {disabled && (
                                                                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                                    {t('organization:plan.coming_soon')}
                                                                </span>
                                                        )}
                                                        {checked && (
                                                            <div className="shrink-0 text-tanavent-blue">
                                                                <CheckCircle2 className="h-6 w-6" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </Radio>
                                ))}
                            </RadioGroup>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-tanavent-error text-sm rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-white border border-border text-text-main rounded-lg h-12 px-6 font-medium active:bg-gray-50 transition-colors"
                            >
                                {t('common:cancel')}
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!name.trim() || isCreating}
                                className="bg-tanavent-blue text-white rounded-lg h-12 px-6 font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isCreating ? t('organization:action.creating') : t('organization:action.create')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

