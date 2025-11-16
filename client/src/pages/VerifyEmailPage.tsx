import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Shield, Mail, ArrowRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const verificationSchema = z.object({
  code: z.string().length(6, "Kode verifikasi harus 6 digit"),
});

type VerificationData = z.infer<typeof verificationSchema>;

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { developer } = useAuth();
  const [isResending, setIsResending] = useState(false);

  const form = useForm<VerificationData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  // Auto-redirect if already verified
  useEffect(() => {
    if (developer?.isEmailVerified) {
      toast({
        title: "Email Sudah Terverifikasi",
        description: "Mengalihkan ke dashboard...",
      });
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1000);
    }
  }, [developer, setLocation, toast]);

  const onSubmit = async (data: VerificationData) => {
    try {
      // Get CSRF token
      const csrfResponse = await fetch("/api/security/csrf", {
        credentials: "include",
      });
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Email Terverifikasi!",
          description: "Email Anda berhasil diverifikasi. Mengalihkan ke dashboard...",
        });
        
        // Invalidate and refetch user query to get updated verification status
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
        
        // Redirect to dashboard after query refetch completes
        setTimeout(() => {
          setLocation("/dashboard");
        }, 500);
      } else if (result.error === "Already verified" || result.message?.includes("already verified")) {
        // Handle already verified case - redirect to dashboard
        toast({
          title: "Email Sudah Terverifikasi",
          description: "Email Anda sudah terverifikasi. Mengalihkan ke dashboard...",
        });
        
        // Refetch user data and redirect
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        await queryClient.refetchQueries({ queryKey: ["/api/auth/user"] });
        
        setTimeout(() => {
          setLocation("/dashboard");
        }, 1000);
      } else {
        throw new Error(result.message || "Verifikasi gagal");
      }
    } catch (error: any) {
      // Check if error is about already verified
      if (error.message?.includes("already verified") || error.message?.includes("Already verified")) {
        toast({
          title: "Email Sudah Terverifikasi",
          description: "Email Anda sudah terverifikasi. Mengalihkan ke dashboard...",
        });
        
        setTimeout(() => {
          setLocation("/dashboard");
        }, 1000);
      } else {
        toast({
          variant: "destructive",
          title: "Verifikasi Gagal",
          description: error.message || "Kode verifikasi tidak valid atau sudah kadaluarsa",
        });
      }
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    try {
      // Get CSRF token
      const csrfResponse = await fetch("/api/security/csrf", {
        credentials: "include",
      });
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Kode Terkirim!",
          description: "Kode verifikasi baru telah dikirim ke email Anda.",
        });
      } else {
        throw new Error(result.message || "Gagal mengirim kode");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim Kode",
        description: error.message || "Terjadi kesalahan saat mengirim kode verifikasi",
      });
    } finally {
      setIsResending(false);
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
                <Mail className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Verifikasi Email
          </CardTitle>
          <CardDescription className="text-sm sm:text-base px-2">
            Kami telah mengirim kode verifikasi 6 digit ke email{" "}
            <span className="font-semibold text-foreground">{developer?.email}</span>
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
                    <FormLabel>Kode Verifikasi</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Masukkan 6 digit kode"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest font-mono"
                        autoComplete="off"
                        data-testid="input-verification-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={form.formState.isSubmitting}
                data-testid="button-verify"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Shield className="mr-2 h-4 w-4 animate-spin" />
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Verifikasi Email
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
                  Tidak menerima kode?
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full backdrop-blur-sm"
              onClick={handleResendCode}
              disabled={isResending}
              data-testid="button-resend-code"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kirim Ulang Kode
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Kode verifikasi akan kadaluarsa dalam 15 menit</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
