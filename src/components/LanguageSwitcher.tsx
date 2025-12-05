import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={language === 'pt' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('pt')}
        className="h-7 px-2 text-xs"
      >
        PT
      </Button>
      <Button
        variant={language === 'en' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => setLanguage('en')}
        className="h-7 px-2 text-xs"
      >
        EN
      </Button>
    </div>
  );
}

export function LanguageSwitcherCompact() {
  const { language, setLanguage } = useLanguage();

  const toggle = () => {
    setLanguage(language === 'pt' ? 'en' : 'pt');
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="gap-1.5">
      <Globe className="h-4 w-4" />
      <span className="uppercase text-xs font-medium">{language}</span>
    </Button>
  );
}
