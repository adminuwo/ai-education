import React from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageSwitcher({ variant = 'compact', className = '' }) {
  const { language, changeLanguage, supportedLanguages, currentLanguage, t } = useLanguage();

  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center rounded-xl bg-muted/60 p-1 border border-border/80 ${className}`}>
        {supportedLanguages.map((lang) => {
          const active = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                active
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`lang-pill-${lang.code}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeLabel}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === 'full' ? (
          <Button
            variant="outline"
            size="sm"
            className={`h-8 gap-2 px-2.5 rounded-lg border-border/80 text-xs font-medium ${className}`}
            data-testid="language-switcher-trigger"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span>{currentLanguage.flag}</span>
            <span className="font-semibold">{currentLanguage.nativeLabel}</span>
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors ${className}`}
            title={t('language.selectLanguage', 'Select Language')}
            data-testid="language-switcher-trigger"
          >
            <div className="relative flex items-center justify-center">
              <Globe className="h-4 w-4" />
              <span className="absolute -bottom-1 -right-1 text-[8px] font-bold uppercase tracking-tighter bg-primary text-primary-foreground px-0.5 rounded leading-none">
                {language}
              </span>
            </div>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 shadow-xl border-border/80">
        <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
          {t('language.selectLanguage', 'Select Language')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {supportedLanguages.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center justify-between px-2.5 py-2 cursor-pointer text-xs font-medium rounded-md ${
                isSelected ? 'bg-primary/10 text-primary font-semibold' : ''
              }`}
              data-testid={`lang-option-${lang.code}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{lang.flag}</span>
                <div className="flex flex-col">
                  <span className="leading-tight">{lang.nativeLabel}</span>
                  {lang.nativeLabel !== lang.label && (
                    <span className="text-[10px] text-muted-foreground leading-tight">{lang.label}</span>
                  )}
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
