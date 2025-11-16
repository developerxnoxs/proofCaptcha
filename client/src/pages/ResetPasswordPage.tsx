import { useEffect } from "react";
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
import { Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const resetPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
  code: z.string().length(6, "Kode reset harus 6 digit"),
  newPassword: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string().min(8, "Password minimal 8 karakter"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
});

type ResetPasswordData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const email = params.get('email');
    if (email) {
      form.setValue('email', email);
    }
  }, [location, form]);

  const onSubmit = async (data: ResetPasswordData) => {
    try {
      const csrfResponse = await fetch("/api/security/csrf", {
        credentials: "include",
      });
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          email: data.email,
          code: data.code,
          newPassword: data.newPassword,
        }),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Password Berhasil Direset!",
          description: "Anda sekarang dapat login dengan password baru Anda.",
        });
        
        setLocation("/login");
      } else {
        throw new Error(result.message || "Reset password gagal");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Password Gagal",
        description: error.message || "Kode reset tidak valid atau sudah kadaluarsa",
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
                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
              </div>
            </div>
          </div>
          
          <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Reset Password
          </CardTitle>
          <CardDescription className="text-sm sm:text-base px-2">
            Masukkan kode yang telah dikirim ke email Anda dan password baru
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

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Reset</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Masukkan 6 digit kode"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest font-mono"
                        autoComplete="off"
                        data-testid="input-reset-code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password Baru</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 8 karakter"
                          data-testid="input-new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Ulangi password baru"
                          data-testid="input-confirm-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          data-testid="button-toggle-confirm-password"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={form.formState.isSubmitting}
                data-testid="button-reset-password"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Lock className="mr-2 h-4 w-4 animate-spin" />
                    Mereset...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Kode reset akan kadaluarsa dalam 15 menit</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
