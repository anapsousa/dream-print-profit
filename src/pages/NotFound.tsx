import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground">{t('error.notFoundMessage')}</p>
        <Button asChild>
          <Link to="/">
            <Home className="w-4 h-4" />
            {t('error.returnHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
