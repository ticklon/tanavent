import { Fragment, useState, useEffect } from "react";
import {
  Dialog,
  Transition,
  TransitionChild,
  DialogPanel,
} from "@headlessui/react";
import {
  X,
  LogOut,
  Building,
  Layers,
  UserCog,
  Settings,
  Languages,
  Home,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../stores/authStore";
import { useViewStore } from "../../stores/viewStore";
import { auth } from "../../lib/firebase";
import { createAuthClient } from "../../lib/client";
import { UserSettingsModal } from "../../features/settings/components/UserSettingsModal";
import { useSectionList } from "../../features/organization/api/useSectionHooks";
import { IconS } from "../Icon/IconS";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

type Organization = {
  id: string;
  name: string;
};

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { t } = useTranslation(["common", "organization"]);
  const { user } = useAuthStore();
  const {
    activeOrganizationId,
    activeSectionId,
    updateCtx,
    changeView,
    language,
    changeLanguage,
  } = useViewStore();

  // Auto-update sections using React Query
  const { data: sections = [] } = useSectionList();

  const [organizationName, setOrganizationName] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const fetchOrgName = async () => {
      if (!user || !activeOrganizationId) return;

      try {
        const token = await user.getIdToken();
        const client = createAuthClient(token);

        // Fetch Org Name
        const resOrg = await client.api.organizations.$get();
        if (resOrg.ok) {
          const orgs = await resOrg.json();
          const currentOrg = orgs.find(
            (o: Organization) => o.id === activeOrganizationId,
          );
          if (currentOrg) setOrganizationName(currentOrg.name);
        }
      } catch (error) {
        console.error("Failed to fetch org name", error);
      }
    };

    fetchOrgName();
  }, [user, activeOrganizationId]);

  const handleLogout = () => {
    auth.signOut();
  };

  const handleLanguageToggle = () => {
    const nextLang = language === "ja" ? "en" : "ja";
    changeLanguage(nextLang);
  };

  const handleSectionClick = (sectionId: string) => {
    if (activeOrganizationId) {
      updateCtx(activeOrganizationId, sectionId);
      setIsOpen(false); // Close mobile sidebar on select
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-surface-base border-r border-border">
      {/* Header / Org Name */}
      <div className="p-2 border-b border-border">
        <div className="flex items-center justify-center space-x-2">
          <IconS />
          <span>TanaVent</span>
        </div>
      </div>
      <div className="py-1 border-b border-border">
        <div className="flex items-center justify-center gap-2 text-tanavent-navy">
          <div className="flex flex-col justify-center items-center">
            <span className="text-xs font-light text-tanavent-blue">{t("organization:label.active_org")}</span>
            <span className="truncate">{organizationName || "..."}</span>
          </div>
        </div>
      </div>

      {/* Navigation / Sections */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-bold text-text-muted uppercase mb-2 tracking-wider">
          {t("organization:settings.sections_title")}
        </div>
        {sections.length === 0 ? (
          <div className="text-sm text-text-muted italic pl-2">
            {t("organization:settings.no_sections")}
          </div>
        ) : (
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => handleSectionClick(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeSectionId === section.id
                      ? "bg-tanavent-blue text-white shadow-sm"
                      : "text-text-main hover:bg-gray-100"
                    }`}
                >
                  <Layers size={18} />
                  <span>{section.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <button
            onClick={() => {
              changeView({ view: "settings" });
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-text-main hover:bg-gray-100 transition-colors"
          >
            <Settings size={18} />
            <span>{t("organization:settings.sidebar_link")}</span>
          </button>
        </div>
      </div>

      {/* Footer / User Info */}
      <div className="p-4 border-t border-border bg-gray-50 space-y-3">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center gap-3 rounded-2xl p-2 bg-tanavent-blue hover:bg-tanavent-blue-hover transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-tanavent-navy text-tanavent-blue-light flex items-center justify-center">
            <UserCog size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-tanavent-blue-light truncate">
              {user?.displayName || "User"}
            </p>
            <p className="text-xs text-tanavent-blue-light truncate">
              {user?.email}
            </p>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleLanguageToggle}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-gray-700 bg-white border border-border rounded-md hover:bg-gray-50 transition"
          >
            <Languages size={18} className="text-gray-400" />
            <div className="flex items-center gap-1">
              <span
                className={
                  language === "ja"
                    ? "text-tanavent-blue"
                    : "text-gray-300 font-extralight"
                }
              >
                JA
              </span>
              <span className="text-gray-200 font-normal">/</span>
              <span
                className={
                  language === "en"
                    ? "text-tanavent-blue"
                    : "text-gray-300 font-extralight"
                }
              >
                EN
              </span>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-border rounded-md hover:bg-gray-50 transition"
          >
            <LogOut size={18} />
            {t("common:logout")}
          </button>
        </div>
      </div>

      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 md:hidden"
          onClose={setIsOpen}
        >
          <TransitionChild
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </TransitionChild>

          <div className="fixed inset-0 z-40 flex">
            <TransitionChild
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <DialogPanel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-6 w-6 text-white" aria-hidden="true" />
                  </button>
                </div>
                <SidebarContent />
              </DialogPanel>
            </TransitionChild>
            <div className="shrink-0 w-14" aria-hidden="true">
              {/* Dummy element to force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
