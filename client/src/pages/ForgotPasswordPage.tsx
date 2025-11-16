import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

declare global {
  interface Window {
    onCaptchaSuccess?: (token: string) => void;
    onCaptchaError?: (error: string) => void;
  }
}

// Schema definition needs to use dynamic translation in component
const getForgotPasswordSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('auth.invalidEmail')),
});

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);

  const { data: demoKey } = useQuery<{ sitekey: string; publicKey: string; name: string }>({
    queryKey: ["/api/demo/key"],
  });

  const forgotPasswordSchema = getForgotPasswordSchema(t);
  type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

  const form = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/proofCaptcha/api.js';
    script.async = true;
    script.onload = () => {
      window.onCaptchaSuccess = (token: string) => {
        setCaptchaToken(token);
      };

      window.onCaptchaError = (error: string) => {
        setCaptchaToken("");
        toast({
          variant: "destructive",
          title: t('auth.captchaError'),
          description: error,
        });
      };

      if (window.ProofCaptcha && captchaContainerRef.current && demoKey?.sitekey) {
        const id = window.ProofCaptcha.render(captchaContainerRef.current, {
          sitekey: demoKey.sitekey,
          type: 'random',
          callback: 'onCaptchaSuccess',
          'error-callback': 'onCaptchaError',
        });
        setWidgetId(id);
      }
    };

    document.body.appendChild(script);

    return () => {
      delete window.onCaptchaSuccess;
      delete window.onCaptchaError;
    };
  }, [demoKey, toast]);

  const onSubmit = async (data: ForgotPasswordData) => {
    if (!captchaToken) {
      toast({
        variant: "destructive",
        title: t('auth.captchaRequired'),
        description: t('auth.completeCaptcha'),
      });
      return;
    }

    try {
      // Get CSRF token
      const csrfResponse = await fetch("/api/security/csrf", {
        credentials: "include",
      });
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          ...data,
          captchaToken,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('auth.codeSent'),
          description: t('auth.codeSentDescription'),
        });
        
        setLocation(`/reset-password?email=${encodeURIComponent(data.email)}`);
      } else {
        throw new Error(result.message || t('auth.failedToSendCode'));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.sendCodeError'),
        description: error.message || t('auth.sendCodeErrorDescription'),
      });
      setCaptchaToken("");
      if (window.ProofCaptcha && widgetId !== null) {
        window.ProofCaptcha.reset(widgetId);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated gradient background blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 sm:w-96 sm:h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob dark:opacity-50" />
        <div className="absolute top-0 -right-4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 dark:opacity-50 dark:bg-purple-500/20" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 sm:w-96 sm:h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 dark:opacity-50 dark:bg-blue-500/20" />
      </div>

      <Card className="w-full max-w-md relative overflow-hidden border-2 shadow-2xl backdrop-blur-sm bg-card/95">
        {/* Card gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-50 pointer-events-none" />
        
        <CardHeader className="text-center space-y-2 sm:space-y-3 relative px-4 sm:px-6 pt-6">
          {/* Floating 3D icon */}
          <div className="flex justify-center mb-3 sm:mb-4 perspective-1000">
            <div className="relative transform-gpu hover:scale-110 transition-all duration-500 floating">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-purple-500/50 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-60 animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-primary to-purple-600 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                <KeyRound className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t('auth.forgotPasswordTitle')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base px-2">
            {t('auth.forgotPasswordSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 relative px-4 sm:px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('auth.emailPlaceholderForgot')}
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div ref={captchaContainerRef} data-testid="captcha-container"></div>

              <Button
                type="submit"
                className="w-full shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={form.formState.isSubmitting}
                data-testid="button-send-reset-code"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Mail className="mr-2 h-4 w-4 animate-pulse" />
                    {t('auth.sending')}
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    {t('auth.sendResetCode')}
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-2 text-muted-foreground">
                  {t('auth.or')}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full backdrop-blur-sm"
              onClick={() => setLocation("/login")}
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.backToLogin')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
