import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";

const createVerifyCodeSchema = (t: (key: string) => string) => z.object({
  code: z.string().length(6, t('auth.resetCodeMustBe6')),
});

export default function VerifyResetCodePage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const verifyCodeSchema = useMemo(() => createVerifyCodeSchema(t), [t, i18n.language]);
  type VerifyCodeData = z.infer<typeof verifyCodeSchema>;

  const form = useForm<VerifyCodeData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      code: "",
    },
  });

  // Update form resolver when language changes
  useEffect(() => {
    form.clearErrors();
  }, [i18n.language, form]);

  const email = new URLSearchParams(window.location.search).get('email');

  useEffect(() => {
    if (!email) {
      toast({
        variant: "destructive",
        title: t('auth.error'),
        description: t('auth.emailNotFound'),
      });
      setLocation("/forgot-password");
    }
  }, [email, setLocation, toast]);

  const onSubmit = async (data: VerifyCodeData) => {
    if (!email) return;

    try {
      const csrfResponse = await fetch("/api/security/csrf", {
        credentials: "include",
      });
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          email: email,
          code: data.code,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: t('auth.codeVerified'),
          description: t('auth.codeVerifiedDesc'),
        });
        
        // Redirect ke halaman reset password dengan token
        setLocation(`/reset-password?token=${result.resetToken}`);
      } else {
        throw new Error(result.message || t('auth.verificationFailed'));
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('auth.verificationFailed'),
        description: error.message || t('auth.invalidResetCode'),
      });
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
                <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {t('auth.verifyCodeTitle')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base px-2">
            {t('auth.verifyCodeSubtitle')} <span className="font-semibold text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6 relative px-4 sm:px-6 pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.verificationCodeLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('auth.enterCodePlaceholder')}
                        maxLength={6}
                        className="text-center text-2xl sm:text-3xl tracking-widest font-mono"
                        autoComplete="off"
                        data-testid="input-verification-code"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-center text-sm text-muted-foreground">
                <p>{t('auth.codeExpiresIn')}</p>
              </div>

              <Button
                type="submit"
                className="w-full shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={form.formState.isSubmitting}
                data-testid="button-verify-code"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Shield className="mr-2 h-4 w-4 animate-pulse" />
                    {t('auth.verifying')}
                  </>
                ) : (
                  <>
                    {t('auth.verifyCodeTitle')}
                    <ArrowRight className="ml-2 h-4 w-4" />
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
              onClick={() => setLocation("/forgot-password")}
              data-testid="button-back-to-forgot"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('auth.backToForgotPassword')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
