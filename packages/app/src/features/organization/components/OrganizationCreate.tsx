
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/authStore';
import { useViewStore } from '../../../stores/viewStore';
import { createAuthClient } from '../../../lib/client';
import { AuthLayout } from '../../auth/components/AuthLayout';

interface OrganizationCreateProps {
    onBack: () => void;
}

export const OrganizationCreate = ({ onBack }: OrganizationCreateProps) => {
    const { t } = useTranslation(['organization', 'common']);
    const { user } = useAuthStore();
    const { updateCtx } = useViewStore();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setLoading(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const client = createAuthClient(token);

            const res = await client.api.organizations.$post({
                json: { name }
            });

            if (!res.ok) {
                throw new Error('Failed to create');
            }

            const data = await res.json();

            // Auto select created org
            updateCtx(data.id, null as any); // No default section

        } catch (err) {
            console.error(err);
            setError('Failed to create organization');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title={t('organization:title.create')}>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="org-name" className="block text-sm font-medium text-gray-700">
                        {t('organization:label.name')}
                    </label>
                    <div className="mt-1">
                        <input
                            id="org-name"
                            name="name"
                            type="text"
                            required
                            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-tanavent-blue focus:border-tanavent-blue sm:text-sm"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center">
                        {error}
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onBack}
                        className="w-1/3 flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tanavent-blue"
                    >
                        {t('organization:action.back')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-2/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-tanavent-blue hover:bg-tanavent-blue-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tanavent-blue"
                    >
                        {loading ? t('organization:action.creating') : t('organization:action.create')}
                    </button>
                </div>
            </form>
        </AuthLayout>
    );
};
