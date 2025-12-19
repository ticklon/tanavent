import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import { useViewStore } from "./stores/viewStore";
import { auth } from "./lib/firebase";
import { InventoryDetailModal } from "./features/inventory/components/InventoryDetailModal";
import { SignIn } from "./features/auth/routes/SignIn";
import { SignUp } from "./features/auth/routes/SignUp";
import "./app.css";
import "./lib/i18n";
import { OrganizationSelect } from "./features/organization/components/OrganizationSelect";
import { OrganizationCreate } from "./features/organization/components/OrganizationCreate";
import { OrganizationSettings } from "./features/organization/components/OrganizationSettings";
import { SectionDashboard } from "./features/inventory/routes/SectionDashboard";
import { MainLayout } from "./components/Layout/MainLayout";
import { ProtectedRoute, OrgRequiredRoute } from "./components/Router/Guards";

// Wrapper to use MainLayout as a Router Layout
const MainLayoutWrapper = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// Component to handle initial redirect or root path
const RootRedirect = () => {
    const { activeOrganizationId } = useViewStore();
    if (!activeOrganizationId) {
        return <Navigate to="/org/select" replace />;
    }
    // If org is selected but no specific route, show empty state or redirect to settings/first section
    return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-gray-500">
            <p className="text-lg">Please select a section from the sidebar.</p>
        </div>
    );
};

function AppRoutes() {
    const navigate = useNavigate();
    
    return (
        <Routes>
            <Route path="/login" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />

            <Route element={<ProtectedRoute />}>
                <Route path="/org/select" element={<OrganizationSelect onCreateClick={() => navigate('/org/create')} />} />
                <Route path="/org/create" element={<OrganizationCreate onBack={() => navigate('/org/select')} />} />

                <Route element={<OrgRequiredRoute />}>
                    <Route element={<MainLayoutWrapper />}>
                        <Route path="/" element={<RootRedirect />} />
                        <Route path="/settings" element={<OrganizationSettings />} />
                        <Route path="/sections/:sectionId" element={<Navigate to="inventory" replace />} />
                        <Route path="/sections/:sectionId/:view" element={<SectionDashboard />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

function App() {
  // initialize removed
  const {
    setUser,
    user: authUser,
    isLoading: isAuthLoading,
    setLoading,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  if (isAuthLoading) {    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
        <AppRoutes />
        {/* Global Modal */}
        <InventoryDetailModal />
    </BrowserRouter>
  );
}

export default App;

