import { useState } from "react";
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
        // Invalidate user query to get updated verification status
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        
        toast({
          title: "Email Terverifikasi!",
          description: "Email Anda berhasil diverifikasi. Anda sekarang dapat mengakses dashboard.",
        });
        
        // Redirect to dashboard
        setLocation("/dashboard");
      } else {
        throw new Error(result.message || "Verifikasi gagal");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verifikasi Gagal",
        description: error.message || "Kode verifikasi tidak valid atau sudah kadaluarsa",
      });
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-2">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Verifikasi Email</CardTitle>
          <CardDescription>
            Kami telah mengirim kode verifikasi 6 digit ke email{" "}
            <span className="font-semibold text-foreground">{developer?.email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                className="w-full"
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
              className="w-full"
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
