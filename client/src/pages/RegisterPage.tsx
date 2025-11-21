import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

const DEMO_PUBLIC_KEY = "pk_ab6c4ac2c8976668e6d92fe401386cae18df4c9b4f5193cb140266f6d9546f1c";

// Declare global ProofCaptcha API
declare global {
  interface Window {
    ProofCaptcha: {
      render: (container: string | HTMLElement, params: any) => number;
      getResponse: (widgetId?: number) => string | null;
      reset: (widgetId?: number) => void;
      ready: (callback: () => void) => void;
    };
    onCaptchaSuccessRegister?: (token: string) => void;
    onCaptchaErrorRegister?: (error: string) => void;
  }
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);
  const { register } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Load api.js script
    const script = document.createElement('script');
    script.src = '/proofCaptcha/api.js';
    script.async = true;
    script.onload = () => {
      // Define global callback functions
      window.onCaptchaSuccessRegister = (token: string) => {
        console.log('[CAPTCHA] Success callback received:', token);
        setCaptchaToken(token);
      };

      window.onCaptchaErrorRegister = (error: string) => {
        console.log('[CAPTCHA] Error callback received:', error);
        setCaptchaToken("");
        toast({
          title: t('auth.captchaError'),
          description: error,
          variant: "destructive",
        });
      };

      // Render captcha widget using ProofCaptcha API
      if (window.ProofCaptcha && captchaContainerRef.current) {
        const id = window.ProofCaptcha.render(captchaContainerRef.current, {
          sitekey: DEMO_PUBLIC_KEY,
          type: 'random',
          callback: 'onCaptchaSuccessRegister',
          'error-callback': 'onCaptchaErrorRegister',
          theme: 'auto'
        });
        setWidgetId(id);
        console.log('[CAPTCHA] Widget rendered with ID:', id);
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete window.onCaptchaSuccessRegister;
      delete window.onCaptchaErrorRegister;
    };
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: t('auth.passwordsDontMatch'),
        description: t('auth.passwordsDontMatchDesc'),
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: t('auth.passwordTooShort'),
        description: t('auth.passwordTooShortDesc'),
        variant: "destructive",
      });
      return;
    }

    if (!captchaToken) {
      toast({
        title: t('auth.captchaRequired'),
        description: t('auth.completeCaptcha'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password, captchaToken);
      setCaptchaToken("");
      // Reset captcha widget
      if (window.ProofCaptcha && widgetId !== null) {
        window.ProofCaptcha.reset(widgetId);
      }
    } catch (error: any) {
      toast({
        title: t('auth.registrationFailed'),
        description: error.message || t('auth.registrationFailedDesc'),
        variant: "destructive",
      });
      setCaptchaToken("");
      // Reset captcha widget
      if (window.ProofCaptcha && widgetId !== null) {
        window.ProofCaptcha.reset(widgetId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="page-register">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 group hover-elevate active-elevate-2">
              <div className="relative">
                <Shield className="h-7 w-7 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg transition-all" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                ProofCaptcha
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex items-center justify-center p-4 py-8 sm:py-12">
        <Card className="w-full max-w-md border-2 shadow-2xl relative overflow-hidden">
          {/* Card gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 pointer-events-none" />
          
          <CardHeader className="space-y-4 relative">
            {/* Floating 3D icon */}
            <div className="flex justify-center">
              <div className="relative transform-gpu hover:scale-110 transition-all duration-500 floating">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-purple-500/50 rounded-2xl blur-xl opacity-60 animate-pulse-slow" />
                <div className="relative bg-gradient-to-br from-primary to-purple-600 p-5 rounded-2xl shadow-xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                  <Shield className="h-10 w-10 text-white drop-shadow-lg" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent" data-testid="text-register-title">
                {t('auth.registerTitle')}
              </CardTitle>
              <CardDescription className="text-center text-base">
                {t('auth.registerSubtitle')}
              </CardDescription>
            </div>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 relative">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">{t('common.name')}</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder={t('auth.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-11 rounded-lg border-2 focus:border-primary transition-colors"
                  data-testid="input-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">{t('common.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 rounded-lg border-2 focus:border-primary transition-colors"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">{t('common.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 rounded-lg border-2 focus:border-primary transition-colors"
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">{t('common.password')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11 rounded-lg border-2 focus:border-primary transition-colors"
                  data-testid="input-confirm-password"
                />
              </div>
              <div ref={captchaContainerRef} data-testid="captcha-container"></div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4 relative">
              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-base group" 
                disabled={isLoading || !captchaToken} 
                data-testid="button-register"
              >
                <span className="flex items-center gap-2">
                  {isLoading ? t('auth.verifyingCaptcha') : t('auth.registerButton')}
                  {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                </span>
              </Button>
              
              <div className="text-sm text-center text-muted-foreground">
                {t('auth.hasAccount')}{" "}
                <Link href="/login" className="text-primary hover:underline font-medium transition-colors" data-testid="link-login">
                  {t('auth.signInLink')}
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
