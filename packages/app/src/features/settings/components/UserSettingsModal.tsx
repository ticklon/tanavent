
import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition, TransitionChild, DialogPanel, DialogTitle, Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Check } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useViewStore } from '../../../stores/viewStore';
import { createAuthClient } from '../../../lib/client';
import { updateProfile } from 'firebase/auth';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Organization = {
    id: string;
    name: string;
};

export const UserSettingsModal = ({ isOpen, onClose }: UserSettingsModalProps) => {
    const { t } = useTranslation(['common', 'settings', 'organization']);
    const { user } = useAuthStore();
    const { activeOrganizationId, setActiveOrganizationId } = useViewStore();
    const navigate = useNavigate();

    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    // Organization State
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [newOrgName, setNewOrgName] = useState('');
    const [isCreatingOrg, setIsCreatingOrg] = useState(false);

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

                // Force update local state if needed (though auth listener should pick it up eventually or re-render)
                // However, updateProfile mutates the user object in place usually, but React might not see it immediately without a state update or context refresh.
                // authStore subscription might not fire on profile update only.
                // We can manually trigger re-fetch or just close.
                // To be safe, let's update the store if possible, but store.setUser takes a User object.
                // The mutable update should be enough if we trigger a re-render.

                // Actually, let's just close as Sidebar uses user.displayName which should be updated on the object reference.
                // If Sidebar doesn't re-render, we might need to force it.
                // Let's try just updating first.
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleCreateOrg = async () => {
        if (!user || !newOrgName) return;
        setIsCreatingOrg(true);
        try {
            const token = await user.getIdToken();
            const client = createAuthClient(token);
            const res = await client.api.organizations.$post({
                json: { name: newOrgName }
            });

            if (res.ok) {
                const newOrg = await res.json();
                // Switch to new org
                setActiveOrganizationId(newOrg.id);
                navigate('/');
                setNewOrgName('');
                fetchOrganizations(); // Refresh list
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreatingOrg(false);
        }
    };

    const handleSwitchOrg = (orgId: string) => {
        if (orgId === activeOrganizationId) return;
        setActiveOrganizationId(orgId);
        navigate('/');
        onClose();
    };

    return (
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
                    <div className="fixed inset-0 bg-black/25" />
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
                            <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
                                        {t('settings:title')}
                                    </DialogTitle>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-500"
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
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        {t('settings:profile.email')}
                                                    </label>
                                                    <div className="mt-1 p-2 bg-gray-50 rounded border border-gray-200 text-gray-500 text-sm">
                                                        {user?.email}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        {t('settings:profile.name')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={displayName}
                                                        onChange={(e) => setDisplayName(e.target.value)}
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-tanavent-blue focus:ring-tanavent-blue sm:text-sm border p-2"
                                                    />
                                                </div>
                                                <div className="pt-2">
                                                    <button
                                                        onClick={handleUpdateProfile}
                                                        disabled={isUpdatingProfile}
                                                        className="w-full inline-flex justify-center rounded-md border border-transparent bg-tanavent-blue px-4 py-2 text-sm font-medium text-white hover:bg-tanavent-blue-hover focus:outline-none focus:ring-2 focus:ring-tanavent-blue focus:ring-offset-2 disabled:opacity-50"
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
                                                    <h4 className="text-sm font-medium text-gray-500 mb-2">{t('settings:organization.current')}</h4>
                                                    <ul className="space-y-2 max-h-40 overflow-y-auto">
                                                        {organizations.map(org => (
                                                            <li key={org.id} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-100">
                                                                <span className={`text-sm ${org.id === activeOrganizationId ? 'font-bold text-tanavent-navy' : 'text-gray-700'}`}>
                                                                    {org.name}
                                                                </span>
                                                                {org.id === activeOrganizationId ? (
                                                                    <Check size={16} className="text-tanavent-blue" />
                                                                ) : (
                                                                    <button
                                                                        onClick={() => handleSwitchOrg(org.id)}
                                                                        className="text-xs text-tanavent-blue hover:underline"
                                                                    >
                                                                        {t('settings:organization.switch')}
                                                                    </button>
                                                                )}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Create New */}
                                                <div className="pt-4 border-t border-gray-100">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('settings:organization.create_new')}</h4>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder={t('settings:organization.name_label')}
                                                            value={newOrgName}
                                                            onChange={(e) => setNewOrgName(e.target.value)}
                                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-tanavent-blue focus:ring-tanavent-blue sm:text-sm border p-2"
                                                        />
                                                        <button
                                                            onClick={handleCreateOrg}
                                                            disabled={!newOrgName || isCreatingOrg}
                                                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-tanavent-navy hover:bg-tanavent-navy-light focus:outline-none disabled:opacity-50"
                                                        >
                                                            {isCreatingOrg ? '...' : t('settings:organization.create_action')}
                                                        </button>
                                                    </div>
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
    );
};
