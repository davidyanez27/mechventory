import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Globe } from '@/UI/helpers';

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center transition-colors bg-background border border-border rounded-full text-muted-foreground h-11 w-11 hover:bg-accent hover:text-foreground"
        aria-label="Switch language"
      >
        <Globe className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl border border-border bg-background shadow-lg z-50 p-1">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { i18n.changeLanguage(lang.code); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-accent ${
                i18n.language === lang.code
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
