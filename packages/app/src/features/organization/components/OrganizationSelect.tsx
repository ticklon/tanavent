
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, LogOut } from 'lucide-react';
import { useAuthStore } from '../../../stores/authStore';
import { useViewStore } from '../../../stores/viewStore';
import { createAuthClient } from '../../../lib/client';
import { auth } from '../../../lib/firebase';
import { AuthLayout } from '../../auth/components/AuthLayout';
import { OrganizationCreateModal } from './OrganizationCreateModal';
import { IconMain } from '../../../components/Icon/IconS';

type Organization = {
    id: string;
    name: string;
};

export const OrganizationSelect = () => {
    const { t } = useTranslation('organization');
    const { user } = useAuthStore();
    const { setActiveOrganizationId } = useViewStore();
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        const fetchOrgs = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const client = createAuthClient(token);
                const res = await client.api.organizations.$get();
                if (res.ok) {
                    const data = await res.json();
                    setOrgs(data);
                }
            } catch (error) {
                console.error('Failed to fetch orgs', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrgs();
    }, [user]);

    const handleSelect = (orgId: string) => {
        setActiveOrganizationId(orgId);
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tanavent-blue"></div>
            </div>
        );
    }

    return (
        <AuthLayout title={orgs.length > 0 ? t('organization:title.select') : ''}>
            <div className="space-y-6">
                {orgs.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-4xl bg-blue-50 mb-6">
                            <IconMain />
                        </div>
                        <h2 className="text-2xl font-bold text-tanavent-navy mb-2">
                            Welcome to Tanavent!
                        </h2>
                        <p className="text-text-muted mb-8 max-w-sm mx-auto">
                            {t('organization:label.no_org')}
                        </p>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent text-base font-bold rounded-xl text-white bg-tanavent-blue hover:bg-tanavent-blue-hover shadow-sm transition-all active:scale-95"
                        >
                            <Plus size={20} />
                            {t('organization:title.create')}
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-4xl bg-blue-50 mb-6">
                            <IconMain />
                        </div>
                        <ul className="space-y-3">
                            {orgs.map((org) => (
                                <li key={org.id}>
                                    <button
                                        onClick={() => handleSelect(org.id)}
                                        className="w-full text-left px-5 py-4 border border-border rounded-xl hover:bg-gray-50 hover:border-tanavent-blue/30 flex justify-between items-center group transition-all bg-white shadow-sm"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-tanavent-blue transition-colors">
                                                <Building2 size={20} />
                                            </div>
                                            <span className="font-bold text-tanavent-navy">{org.name}</span>
                                        </div>
                                        <span className="text-tanavent-blue text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                                            {t('organization:action.select')} &rarr;
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="pt-6 border-t border-border">
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed border-border text-sm font-bold rounded-xl text-text-muted hover:border-tanavent-blue hover:text-tanavent-blue transition-colors"
                            >
                                <Plus size={18} />
                                {t('organization:title.create')}
                            </button>
                        </div>
                    </>
                )}

                <div className="flex justify-center pt-2">
                    <button
                        onClick={() => auth.signOut()}
                        className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-tanavent-error transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                        <LogOut size={16} />
                        {t('auth:action.signout')}
                    </button>
                </div>
            </div>
            
            <OrganizationCreateModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
            />
        </AuthLayout>
    );
};

