import { Button } from "@/components/ui/button";
import { Shield, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-2xl mx-4 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-primary to-primary/70 p-8 rounded-3xl shadow-2xl">
              <Shield className="w-24 h-24 text-primary-foreground" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent mb-4">
            404
          </h1>
          <h2 className="text-3xl font-bold mb-4">
            {t('notFound.title')}
          </h2>
          <div className="max-w-md mx-auto space-y-3">
            <p className="text-lg text-muted-foreground">
              {t('notFound.description')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 justify-center mt-8">
          <Link href="/">
            <Button size="lg" className="gap-2" data-testid="button-home">
              <Home className="w-5 h-5" />
              {t('notFound.goHome')}
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2"
            onClick={() => window.history.back()}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.cancel')}
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto opacity-50">
          <div className="h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full"></div>
          <div className="h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent rounded-full"></div>
          <div className="h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full"></div>
        </div>

        <div className="mt-12">
          <p className="text-sm text-muted-foreground/60">
            Powered by <span className="font-semibold text-primary">ProofCaptcha</span>
          </p>
        </div>
      </div>
    </div>
  );
}
