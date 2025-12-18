import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import { useViewStore } from "./stores/viewStore";
import { useAuthStore } from "./stores/authStore";
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

function App() {
  const { t } = useTranslation(["common", "inventory", "auth"]);
  const {
    initialize,
    language,
    changeLanguage,
    activeSectionId,
    activeOrganizationId,
    updateCtx,
    openDetail,
    lastViewState,
  } = useViewStore();
  const {
    setUser,
    user: authUser,
    isLoading: isAuthLoading,
    setLoading,
  } = useAuthStore();

  // View state for organization workflow
  const [viewState, setViewState] = useState<
    "main" | "org-select" | "org-create"
  >("main");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (!isAuthLoading && authUser) {
      initialize();
    }
  }, [initialize, isAuthLoading, authUser]);

  // Routing Logic
  const path = window.location.pathname;
  if (!isAuthLoading && !authUser && path !== "/login" && path !== "/signup") {
    window.location.href = "/login";
    return null;
  }

  // Organization Workflow Logic
  useEffect(() => {
    if (authUser && !activeOrganizationId) {
      setViewState("org-select");
    } else if (authUser && activeOrganizationId) {
      setViewState("main");
    }
  }, [authUser, activeOrganizationId]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (path === "/signup") {
    return <SignUp />;
  }

  if (path === "/login") {
    return <SignIn />;
  }

  // Handle Organization Selection Flow
  if (viewState === "org-select") {
    return (
      <OrganizationSelect onCreateClick={() => setViewState("org-create")} />
    );
  }

  if (viewState === "org-create") {
    return <OrganizationCreate onBack={() => setViewState("org-select")} />;
  }

  return (
    <MainLayout>
      {lastViewState.view === "settings" ? (
        <OrganizationSettings />
      ) : (
        <SectionDashboard />
      )}

      {/* Detail Modal handles its own state via global store */}
      <InventoryDetailModal />
    </MainLayout>
  );
}

export default App;

