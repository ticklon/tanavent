
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Check, Plus } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useViewStore } from '../../../stores/viewStore';
import { createAuthClient } from '../../../lib/client';
import { updateProfile } from 'firebase/auth';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateOrg: () => void;
}

type Organization = {
    id: string;
    name: string;
};

export const UserSettingsModal = ({ isOpen, onClose, onCreateOrg }: UserSettingsModalProps) => {
    const { t } = useTranslation(['common', 'settings', 'organization']);
    const { user } = useAuthStore();
    const { activeOrganizationId, setActiveOrganizationId } = useViewStore();
    const navigate = useNavigate();

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Organization State
    const [organizations, setOrganizations] = useState<Organization[]>([]);

    useEffect(() => {
        if (isOpen && user) {
            setDisplayName(user.displayName || '');
            fetchOrganizations();
        }
    }, [isOpen, user]);

    const fetchOrganizations = async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const client = createAuthClient(token);
            const res = await client.api.organizations.$get();
            if (res.ok) {
                const data = await res.json();
                setOrganizations(data);
            }
        } catch (error) {
            console.error('Failed to fetch orgs', error);
        }
    };

    const handleUpdateProfile = async () => {
        if (!user) return;
        setIsUpdatingProfile(true);
        try {
            // 1. Update DB via API
            const token = await user.getIdToken();
            const client = createAuthClient(token);
            const res = await client.api.users.me.$put({
                json: { displayName }
            });

            if (res.ok) {
                // 2. Update Firebase Profile (for Client Side UI)
                await updateProfile(user, { displayName });
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleSwitchOrg = (orgId: string) => {
        if (orgId === activeOrganizationId) return;
        setActiveOrganizationId(orgId);
        navigate('/');
        onClose();
    };

    return (
        <>
            <Transition show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={onClose}>
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-tanavent-navy/20 backdrop-blur-[2px]" />
                    </TransitionChild>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <TransitionChild
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-surface-card p-6 text-left align-middle shadow-xl transition-all">
                                    <div className="flex justify-between items-center mb-4">
                                        <DialogTitle as="h3" className="text-lg font-bold text-tanavent-navy">
                                            {t('settings:title')}
                                        </DialogTitle>
                                        <button
                                            onClick={onClose}
                                            className="p-2 rounded-full hover:bg-black/5 text-text-muted transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    <TabGroup>
                                        <TabList className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-4">
                                            <Tab className={({ selected }) =>
                                                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                                ${selected ? 'bg-white shadow text-tanavent-blue' : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-800'}`
                                            }>
                                                {t('settings:tab.profile')}
                                            </Tab>
                                            <Tab className={({ selected }) =>
                                                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                                                ${selected ? 'bg-white shadow text-tanavent-blue' : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-800'}`
                                            }>
                                                {t('settings:tab.organization')}
                                            </Tab>
                                        </TabList>
                                        <TabPanels>
                                            {/* Profile Tab */}
                                            <TabPanel>
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-text-main">
                                                            {t('settings:profile.email')}
                                                        </label>
                                                        <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-border text-text-muted text-sm">
                                                            {user?.email}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-text-main">
                                                            {t('settings:profile.name')}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={displayName}
                                                            onChange={(e) => setDisplayName(e.target.value)}
                                                            className="mt-1 w-full h-12 px-4 rounded-lg border border-border bg-white text-base focus:ring-2 focus:ring-tanavent-blue focus:border-transparent outline-none transition-shadow"
                                                        />
                                                    </div>
                                                    <div className="pt-2">
                                                        <button
                                                            onClick={handleUpdateProfile}
                                                            disabled={isUpdatingProfile}
                                                            className="w-full inline-flex justify-center items-center rounded-lg border border-transparent bg-tanavent-blue px-4 py-3 text-sm font-bold text-white hover:bg-tanavent-blue-hover focus:outline-none focus:ring-2 focus:ring-tanavent-blue focus:ring-offset-2 disabled:opacity-50 active:scale-95 transition-transform"
                                                        >
                                                            {isUpdatingProfile ? t('common:loading') : t('settings:profile.update')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </TabPanel>

                                            {/* Organization Tab */}
                                            <TabPanel>
                                                <div className="space-y-6">
                                                    {/* Current / Switch */}
                                                    <div>
                                                        <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">{t('settings:organization.current')}</h4>
                                                        <ul className="space-y-2 max-h-40 overflow-y-auto">
                                                            {organizations.map(org => (
                                                                <li key={org.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-border transition-colors">
                                                                    <span className={`text-sm ${org.id === activeOrganizationId ? 'font-bold text-tanavent-navy' : 'text-text-main'}`}>
                                                                        {org.name}
                                                                    </span>
                                                                    {org.id === activeOrganizationId ? (
                                                                        <Check size={18} className="text-tanavent-blue" />
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleSwitchOrg(org.id)}
                                                                            className="text-xs font-bold text-tanavent-blue hover:underline"
                                                                        >
                                                                            {t('settings:organization.switch')}
                                                                        </button>
                                                                    )}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>

                                                    {/* Create New Trigger */}
                                                    <div className="pt-4 border-t border-border">
                                                        <button
                                                            onClick={() => {
                                                                onClose();
                                                                onCreateOrg();
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-3 text-sm font-medium text-text-muted hover:border-tanavent-blue hover:text-tanavent-blue transition-colors"
                                                        >
                                                            <Plus size={18} />
                                                            {t('organization:title.create')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </TabPanel>
                                        </TabPanels>
                                    </TabGroup>
                                </DialogPanel>
                            </TransitionChild>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
};

