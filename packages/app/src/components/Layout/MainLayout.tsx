import { useSectionList } from "../../features/organization/api/useSectionHooks";
import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";
import { useParams } from "react-router-dom";

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { sectionId } = useParams<{ sectionId: string }>();
  const { data: sections } = useSectionList();
  const activeSection = sections?.find((s) => s.id === sectionId);

  return (
    <div className="min-h-screen bg-surface-base">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 md:hidden flex justify-between items-center p-2 bg-white border-b border-gray-200">
          {/* Mobile Header: Active Section Name */}
          <div className="md:hidden ml-3">
            <h1 className="text-xl font-bold text-tanavent-navy">
              {activeSection?.name || "..."}
            </h1>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <main className="flex-1">
          <div className="py-3 md:py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
