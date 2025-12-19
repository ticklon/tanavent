import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Package, ShoppingCart, ClipboardList } from "lucide-react";
import { useViewStore } from "../../../stores/viewStore";
import { useInventoryQuery } from "../api/useInventoryHooks";
import { InventoryList } from "../components/InventoryList";
import { InventoryAddModal } from "../components/InventoryAddModal";
import { useSectionList } from "../../organization/api/useSectionHooks";

type TabType = "inventory" | "purchasing" | "stocktaking";

export const SectionDashboard = () => {
  const { t } = useTranslation(["common", "inventory"]);
  // ViewStore no longer manages section/view state
  const { openDetail } = useViewStore(); // Keep openDetail for now if it's still global (or move to URL later)
  
  const { sectionId, view } = useParams<{ sectionId: string; view?: string }>();
  const navigate = useNavigate();

  // Fetch sections to get name
  const { data: sections } = useSectionList();
  const activeSection = sections?.find((s) => s.id === sectionId);

  // Determine active tab from URL param
  const activeTab: TabType =
    view === "purchasing" || view === "stocktaking"
      ? view
      : "inventory";

  const { data, isLoading, error } = useInventoryQuery(sectionId); // Pass sectionId explicitly

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (!sectionId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
        <div className="bg-gray-100 p-4 rounded-full mb-4">
          <Package size={48} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">
          No Section Selected
        </h2>
        <p className="text-gray-500 max-w-sm">
          Please select a section from the sidebar to view its inventory.
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "inventory", label: t("inventory:tab.inventory"), icon: Package },
    {
      id: "purchasing",
      label: t("inventory:tab.purchasing"),
      icon: ShoppingCart,
    },
    {
      id: "stocktaking",
      label: t("inventory:tab.stocktaking"),
      icon: ClipboardList,
    },
  ] as const;

  const handleTabChange = (tabId: string) => {
      navigate(`/sections/${sectionId}/${tabId}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-2 md:p-6 space-y-6">
      {/* Mobile Header: Active Section Name */}
      <div className="md:hidden pb-2 border-b border-gray-100">
          <h1 className="text-xl font-bold text-tanavent-navy">
              {activeSection?.name || '...'}
          </h1>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Mobile: Tab Dropdown */}
        <div className="md:hidden w-full">
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => handleTabChange(e.target.value)}
              className="w-full appearance-none bg-gray-50 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl leading-tight focus:outline-none focus:bg-white focus:border-tanavent-blue font-bold shadow-sm"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
              <svg
                className="fill-current h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Desktop: Tabs */}
        <div className="hidden md:flex bg-gray-100/80 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 md:flex-none justify-center
                                    ${isActive
                    ? "bg-white text-tanavent-blue shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                  }
                                `}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>


        {/* Main Action (Only for Inventory tab for now) */}
        {activeTab === "inventory" && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-tanavent-blue text-white px-5 py-3 md:py-2.5 rounded-lg font-bold shadow-sm hover:bg-tanavent-blue-hover active:scale-95 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
          >
            <span>+</span>
            <span>{t("common:add_item")}</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="min-h-100">
        {activeTab === "inventory" && (
          <>
            {isLoading && (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tanavent-blue"></div>
              </div>
            )}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-100">
                Error loading inventory. Please try again.
              </div>
            )}
            {data && (
              <InventoryList
                // @ts-ignore: API types might need update, ignoring strictly for now
                items={data?.items || []}
                onSelect={(id) => openDetail(id)}
              />
            )}
            {data?.items?.length === 0 && !isLoading && (
              <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">
                  No items in this section
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Click the button above to add your first item.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "purchasing" && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <ShoppingCart size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Purchasing feature coming soon</p>
          </div>
        )}

        {activeTab === "stocktaking" && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <ClipboardList size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Stocktaking feature coming soon</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <InventoryAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        sectionId={sectionId}
      />
    </div>
  );
};
