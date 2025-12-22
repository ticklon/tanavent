import { Navigate, Outlet } from 'react-router-dom';
import { useViewStore } from '../../stores/viewStore';
import { useAuthStore } from '../../stores/authStore';
import { useOrganizationList } from '../../features/organization/api/useOrganizationHooks';
import { useEffect } from 'react';

export const ProtectedRoute = () => {
    const { user, isLoading } = useAuthStore();

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export const OrgRequiredRoute = () => {
    const { activeOrganizationId, setActiveOrganizationId } = useViewStore();
    const { data: orgs, isLoading } = useOrganizationList();

    // Effect to validate or auto-select organization
    useEffect(() => {
        if (isLoading || !orgs) return;

        // 1. User has no organizations at all -> Redirect to selection/creation
        if (orgs.length === 0) {
            return; // Will be handled by render redirect
        }

        // 2. activeOrganizationId is set, but not found in the user's org list (e.g. removed, or stale local storage)
        const isValid = orgs.some(o => o.id === activeOrganizationId);
        if (activeOrganizationId && !isValid) {
             // Auto-switch to the first available org
             setActiveOrganizationId(orgs[0].id);
        }
        
        // 3. activeOrganizationId is not set, but user has orgs
        if (!activeOrganizationId && orgs.length > 0) {
             setActiveOrganizationId(orgs[0].id);
        }
    }, [orgs, isLoading, activeOrganizationId, setActiveOrganizationId]);


    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    // Strict Check: If no organizations exist in DB, force redirect to selection
    if (!orgs || orgs.length === 0) {
        return <Navigate to="/org/select" replace />;
    }

    // Wait for auto-correction if ID is invalid but orgs exist
    const isValid = orgs.some(o => o.id === activeOrganizationId);
    if (!activeOrganizationId || !isValid) {
         return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
    }

    return <Outlet />;
};
