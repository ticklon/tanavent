import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  useSectionList,
  useSectionMutation,
  Section,
} from "../api/useSectionHooks";
import { Plus } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  initialValue?: string;
  title: string;
  submitLabel: string;
  isLoading: boolean;
};

const SectionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialValue = "",
  title,
  submitLabel,
  isLoading,
}: ModalProps) => {
  const [name, setName] = useState(initialValue);
  const { t } = useTranslation(["common"]);

  useEffect(() => {
    setName(initialValue);
  }, [initialValue, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 animate-fade-in-up">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("organization:settings.create_section_label")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tanavent-blue focus:border-transparent outline-none transition-all"
            placeholder={t("organization:settings.placeholder_section_name")}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t("common:cancel")}
          </button>
          <button
            onClick={() => onSubmit(name)}
            disabled={!name.trim() || isLoading}
            className="px-4 py-2 bg-tanavent-blue text-white font-bold rounded-lg shadow hover:bg-tanavent-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? t("organization:action.creating") : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export const OrganizationSettings = () => {
  const { t } = useTranslation(["common", "organization"]);
  const { data: sections, isLoading } = useSectionList();
  const { createSection, updateSection, deleteSection } = useSectionMutation();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  const handleCreate = async (name: string) => {
    try {
      await createSection.mutateAsync(name);
      setIsCreateOpen(false);
    } catch (e) {
      console.error(e);
      alert(t("organization:settings.error_create"));
    }
  };

  const handleUpdate = async (name: string) => {
    if (!editingSection) return;
    try {
      await updateSection.mutateAsync({ id: editingSection.id, name });
      setEditingSection(null);
    } catch (e) {
      console.error(e);
      alert(t("organization:settings.error_update"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("organization:settings.confirm_delete"))) return;
    try {
      await deleteSection.mutateAsync(id);
    } catch (e) {
      console.error(e);
      alert(t("organization:settings.error_delete"));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("organization:settings.title")}
          </h1>
          <p className="text-gray-500 mt-1">{t("organization:settings.subtitle")}</p>
        </div>
      </div>

      {/* Sections Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-700">{t("organization:settings.sections_title")}</h2>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="text-sm bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 hover:text-tanavent-blue hover:border-tanavent-blue transition-all shadow-sm flex items-center gap-2"
          >
            <Plus size={18}/> {t("organization:settings.new_section")}
          </button>
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : !sections || sections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t("organization:settings.no_sections")}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left">{t("organization:settings.table_name")}</th>
                  <th className="px-6 py-3 text-right">{t("organization:settings.table_actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sections.map((section) => (
                  <tr
                    key={section.id}
                    className="group hover:bg-blue-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {section.name}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => setEditingSection(section)}
                        className="text-gray-400 hover:text-tanavent-blue p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      <SectionModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        title={t("organization:settings.modal_create_title")}
        submitLabel={t("organization:action.create")}
        isLoading={createSection.isPending}
      />

      <SectionModal
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        onSubmit={handleUpdate}
        initialValue={editingSection?.name}
        title={t("organization:settings.modal_edit_title")}
        submitLabel={t("common:save")}
        isLoading={updateSection.isPending}
      />
    </div>
  );
};
