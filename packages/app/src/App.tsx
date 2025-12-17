import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { onAuthStateChanged } from "firebase/auth";
import { useViewStore } from "./stores/viewStore";
import { useAuthStore } from "./stores/authStore";
import { auth } from "./lib/firebase";
import { InventoryList } from "./features/inventory/components/InventoryList";
import { InventoryDetailModal } from "./features/inventory/components/InventoryDetailModal";
import { InventoryAddModal } from "./features/inventory/components/InventoryAddModal";
import { useInventoryQuery } from "./features/inventory/api/useInventoryHooks";
import { SignIn } from "./features/auth/routes/SignIn";
import { SignUp } from "./features/auth/routes/SignUp";
import "./app.css";
import "./lib/i18n";
import { OrganizationSelect } from "./features/organization/components/OrganizationSelect";
import { OrganizationCreate } from "./features/organization/components/OrganizationCreate";
import { OrganizationSettings } from "./features/organization/components/OrganizationSettings";
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
  const { data, isLoading: isInventoryLoading, error } = useInventoryQuery();
  const {
    setUser,
    user: authUser,
    isLoading: isAuthLoading,
    setLoading,
  } = useAuthStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
        <>
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-tanavent-navy-light uppercase tracking-wider">
              {t("inventory:list.title")}
            </h2>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-tanavent-blue text-white px-4 py-2 rounded-lg font-bold shadow-sm active:scale-95 transition"
            >
              + {t("common:add_item")}
            </button>
          </div>

          {!activeSectionId ? (
            <div className="text-center p-10 bg-white rounded-lg shadow mt-10">
              <p className="text-gray-500 mb-4">No section selected</p>
              <p className="text-sm text-gray-400">
                Please select or create settings from the sidebar.
              </p>
            </div>
          ) : (
            <>
              {isInventoryLoading && (
                <p className="text-center py-10">Loading...</p>
              )}
              {error && (
                <p className="text-red-500 text-center py-10">
                  Error loading inventory
                </p>
              )}

              {data && (
                <InventoryList
                  // @ts-ignore: Temporary fix
                  items={data?.items || []}
                  onSelect={(id) => openDetail(id)}
                />
              )}
            </>
          )}

          {/* Detail Modal handles its own state via global store */}
          <InventoryDetailModal />

          {/* Add Modal controlled by local state */}
          <InventoryAddModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
          />
        </>
      )}
    </MainLayout>
  );
}

export default App;
