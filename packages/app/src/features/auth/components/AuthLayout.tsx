import { ReactNode } from "react";
import { useViewStore } from "../../../stores/viewStore";
import { Languages } from "lucide-react";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
}

export const AuthLayout = ({ children, title }: AuthLayoutProps) => {
    const { language, changeLanguage } = useViewStore();
    const handleLanguageToggle = () => {
        const nextLang = language === "ja" ? "en" : "ja";
        changeLanguage(nextLang);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {title}
                    </h2>
                </div>
                {children}
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
            </div>
        </div>
    );
};
