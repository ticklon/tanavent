
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/authStore';
import { createAuthClient } from '../../../lib/client';

type Organization = {
    id: string;
    name: string;
};

export const useOrganizationList = () => {
    const { user } = useAuthStore();

    return useQuery({
        queryKey: ['organizations', user?.uid],
        queryFn: async () => {
            if (!user) return [];
            const token = await user.getIdToken();
            const client = createAuthClient(token);
            const res = await client.api.organizations.$get();
            if (!res.ok) {
                throw new Error('Failed to fetch organizations');
            }
            return res.json() as Promise<Organization[]>;
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
