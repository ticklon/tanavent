import { Navigate, Outlet } from 'react-router-dom';
import { useViewStore } from '../../stores/viewStore';
import { useAuthStore } from '../../stores/authStore';

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
    const { activeOrganizationId } = useViewStore();

    if (!activeOrganizationId) {
        return <Navigate to="/org/select" replace />;
    }

    return <Outlet />;
};
