
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { useViewStore } from '../../../stores/viewStore';
import { createAuthClient } from '../../../lib/client';
import { auth } from '../../../lib/firebase';
import { AuthLayout } from '../../auth/components/AuthLayout';

type Organization = {
    id: string;
    name: string;
};

interface OrganizationSelectProps {
    onCreateClick: () => void;
}

export const OrganizationSelect = ({ onCreateClick }: OrganizationSelectProps) => {
    const { t } = useTranslation('organization');
    const { user } = useAuthStore();
    const { setActiveOrganizationId } = useViewStore();
    const navigate = useNavigate();
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

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
        return <div className="p-4 text-center">Loading...</div>;
    }

    return (
        <AuthLayout title={t('organization:title.select')}>
            <div className="space-y-4">
                {orgs.length === 0 ? (
                    <p className="text-gray-500 text-center">{t('organization:label.no_org')}</p>
                ) : (
                    <ul className="space-y-2">
                        {orgs.map((org) => (
                            <li key={org.id}>
                                <button
                                    onClick={() => handleSelect(org.id)}
                                    className="w-full text-left px-4 py-3 border rounded-md hover:bg-gray-50 flex justify-between items-center group"
                                >
                                    <span className="font-medium text-gray-900">{org.name}</span>
                                    <span className="text-tanavent-blue opacity-0 group-hover:opacity-100 transition-opacity">
                                        {t('organization:action.select')}
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="pt-4 border-t">
                    <button
                        onClick={onCreateClick}
                        className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-tanavent-blue hover:bg-tanavent-blue-hover"
                    >
                        {t('organization:title.create')}
                    </button>
                    <button
                        onClick={() => auth.signOut()}
                        className="mt-2 w-full flex justify-center py-2 px-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                        {t('auth:action.signout')}
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
};
