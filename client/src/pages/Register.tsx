import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Check, Shield, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [registeredKeys, setRegisteredKeys] = useState<{
    sitekey: string;
    secretkey: string;
    name: string;
    domain: string;
  } | null>(null);
  const [copiedSitekey, setCopiedSitekey] = useState(false);
  const [copiedSecretkey, setCopiedSecretkey] = useState(false);
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/proofCaptcha/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Registration failed");
      }

      const data = await response.json();
      setRegisteredKeys({
        sitekey: data.publicKey,
        secretkey: data.privateKey,
        name: data.name,
        domain: data.domain,
      });

      toast({
        title: "Registrasi Berhasil!",
        description: "API keys Anda telah dibuat. Simpan dengan aman.",
      });

      setName("");
      setDomain("");
    } catch (error: any) {
      toast({
        title: "Registrasi Gagal",
        description: error.message || "Terjadi kesalahan saat registrasi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: "sitekey" | "secretkey") => {
    navigator.clipboard.writeText(text);
    if (type === "sitekey") {
      setCopiedSitekey(true);
      setTimeout(() => setCopiedSitekey(false), 2000);
    } else {
      setCopiedSecretkey(true);
      setTimeout(() => setCopiedSecretkey(false), 2000);
    }
    toast({
      title: "Disalin!",
      description: `${type === "sitekey" ? "Sitekey" : "Secretkey"} telah disalin ke clipboard`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-6 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 dark:text-blue-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">ProofCaptcha</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Daftar dan dapatkan API keys untuk mengintegrasikan CAPTCHA ke website Anda
          </p>
        </div>

        {!registeredKeys ? (
          <Card data-testid="card-registration">
            <CardHeader>
              <CardTitle>Registrasi Developer</CardTitle>
              <CardDescription>
                Masukkan nama aplikasi dan domain website Anda untuk mendapatkan sitekey dan secretkey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Aplikasi/Website</Label>
                  <Input
                    id="name"
                    data-testid="input-app-name"
                    type="text"
                    placeholder="Contoh: Website Saya"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="domain">Domain Website</Label>
                  <Input
                    id="domain"
                    data-testid="input-domain"
                    type="text"
                    placeholder="Contoh: example.com atau localhost"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Masukkan domain tanpa https:// (contoh: example.com atau localhost:3000)
                  </p>
                </div>

                <Button
                  type="submit"
                  data-testid="button-register"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Mendaftarkan..." : "Daftar Sekarang"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <Key className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Registrasi berhasil! Simpan API keys Anda dengan aman. Secretkey tidak akan ditampilkan lagi.
              </AlertDescription>
            </Alert>

            <Card data-testid="card-keys-result">
              <CardHeader>
                <CardTitle>API Keys Anda</CardTitle>
                <CardDescription>
                  {registeredKeys.name} - {registeredKeys.domain}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sitekey (Public Key)</Label>
                  <div className="flex gap-2">
                    <Input
                      data-testid="text-sitekey"
                      value={registeredKeys.sitekey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      data-testid="button-copy-sitekey"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(registeredKeys.sitekey, "sitekey")}
                    >
                      {copiedSitekey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gunakan sitekey ini di widget HTML Anda
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Secretkey (Private Key)</Label>
                  <div className="flex gap-2">
                    <Input
                      data-testid="text-secretkey"
                      value={registeredKeys.secretkey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      data-testid="button-copy-secretkey"
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(registeredKeys.secretkey, "secretkey")}
                    >
                      {copiedSecretkey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gunakan secretkey ini untuk verifikasi di server Anda
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Cara Menggunakan:</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-1">1. Tambahkan widget di HTML Anda:</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
{`<!-- Load proofCaptcha API -->
<script src="${window.location.origin}/proofCaptcha/api.js" async defer></script>

<!-- Widget CAPTCHA -->
<div class="proof-captcha" data-sitekey="${registeredKeys.sitekey}"></div>`}
                      </pre>
                    </div>

                    <div>
                      <p className="font-medium mb-1">2. Verifikasi di server (PHP):</p>
                      <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
{`$secret_key = "${registeredKeys.secretkey}";
$response = $_POST['proof-captcha-response'];
$verify = file_get_contents("${window.location.origin}/proofCaptcha/api/siteverify?secret={$secret_key}&response={$response}");
$result = json_decode($verify);

if ($result->success) {
    // CAPTCHA valid
} else {
    // CAPTCHA tidak valid
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <Button
                  data-testid="button-register-another"
                  variant="outline"
                  onClick={() => setRegisteredKeys(null)}
                  className="w-full"
                >
                  Daftar Aplikasi Lain
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Fitur ProofCaptcha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">Proof-of-Work Security</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sistem keamanan berbasis proof-of-work yang sulit ditembus bot
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Key className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold">Easy Integration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Integrasi mudah dengan API yang kompatibel dengan berbagai platform
                </p>
              </div>
              <div className="space-y-2">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold">Real-time Analytics</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Monitor performa dan keamanan CAPTCHA Anda secara real-time
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
