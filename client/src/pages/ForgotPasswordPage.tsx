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

declare global {
  interface Window {
    onCaptchaSuccess?: (token: string) => void;
    onCaptchaError?: (error: string) => void;
  }
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [widgetId, setWidgetId] = useState<number | null>(null);
  const captchaContainerRef = useRef<HTMLDivElement>(null);

  const { data: demoKey } = useQuery<{ sitekey: string; publicKey: string; name: string }>({
    queryKey: ["/api/demo/key"],
  });

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
          title: "CAPTCHA Error",
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
        title: "CAPTCHA Diperlukan",
        description: "Silakan selesaikan CAPTCHA terlebih dahulu",
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          captchaToken,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Kode Terkirim!",
          description: "Kode reset password telah dikirim ke email Anda.",
        });
        
        setLocation(`/reset-password?email=${encodeURIComponent(data.email)}`);
      } else {
        throw new Error(result.message || "Gagal mengirim kode reset");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Kode",
        description: error.message || "Terjadi kesalahan. Silakan coba lagi.",
      });
      setCaptchaToken("");
      if (window.ProofCaptcha && widgetId !== null) {
        window.ProofCaptcha.reset(widgetId);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-2">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email Anda dan kami akan mengirimkan kode untuk reset password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="nama@email.com"
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
                className="w-full"
                disabled={form.formState.isSubmitting}
                data-testid="button-send-reset-code"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Mail className="mr-2 h-4 w-4 animate-pulse" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Kirim Kode Reset
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
                  Atau
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/login")}
              data-testid="button-back-to-login"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
