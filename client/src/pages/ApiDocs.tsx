import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CaptchaWidget from "@/components/CaptchaWidget";
import { useToast } from "@/hooks/use-toast";
import { Code2, Shield, Lock, Key, Fingerprint, AlertTriangle, CheckCircle2, XCircle, Activity, Zap, Globe, Code } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ApiDocs() {
  const { t } = useTranslation();
  const isDev = import.meta.env.DEV;
  const [verified, setVerified] = useState(false);
  const [selectedType, setSelectedType] = useState<"random" | "grid" | "jigsaw" | "gesture" | "upside_down">("random");
  const { toast } = useToast();

  const { data: demoKey, isLoading: isDemoKeyLoading } = useQuery<{ sitekey: string; publicKey: string; name: string }>({
    queryKey: ["/api/demo/key"],
  });

  const handleSuccess = () => {
    setVerified(true);
    toast({
      title: t('apiDocs.demo.toast.verificationSuccess'),
      description: t('apiDocs.demo.toast.captchaCompleted'),
    });
  };

  useEffect(() => {
    if (verified) {
      const timer = setTimeout(() => setVerified(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [verified]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-3 py-4 sm:p-6 space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-2 sm:gap-3"
        >
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg shadow-purple-500/30">
            <Code className="h-4 w-4 sm:h-6 sm:w-6 text-white" data-testid="icon-api-docs" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" data-testid="heading-api-docs">{t('apiDocs.title')}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{t('apiDocs.subtitle')}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="demo" className="w-full">
        <div className="overflow-x-auto -mx-3 px-3 sm:-mx-0 sm:px-0 pb-1">
          <TabsList className="inline-flex sm:grid sm:grid-cols-5 w-auto sm:w-full gap-1 sm:gap-2" data-testid="tabs-api-docs">
            <TabsTrigger value="demo" data-testid="tab-demo" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{t('apiDocs.tabs.demo')}</TabsTrigger>
            <TabsTrigger value="frontend" data-testid="tab-frontend" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{t('apiDocs.tabs.frontend')}</TabsTrigger>
            <TabsTrigger value="backend" data-testid="tab-backend" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{t('apiDocs.tabs.backend')}</TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{t('apiDocs.tabs.security')}</TabsTrigger>
            <TabsTrigger value="best-practices" data-testid="tab-best-practices" className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">{t('apiDocs.tabs.bestPractices')}</TabsTrigger>
          </TabsList>
        </div>

        {/* Live Demo Tab */}
        <TabsContent value="demo" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>{t('apiDocs.demo.alert.title')}</AlertTitle>
            <AlertDescription>
              {t('apiDocs.demo.alert.description')}
            </AlertDescription>
          </Alert>

          <Card data-testid="card-checkbox-demo" className="card-3d">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg">{t('apiDocs.demo.card.title')}</CardTitle>
                  <CardDescription className="mt-1 sm:mt-2 text-xs sm:text-sm">
                    {t('apiDocs.demo.card.description')}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {isDev && (
                    <Select
                      value={selectedType}
                      onValueChange={(value) => setSelectedType(value as typeof selectedType)}
                      data-testid="select-challenge-type"
                    >
                      <SelectTrigger className="w-full sm:w-40 text-xs sm:text-sm" data-testid="trigger-challenge-type">
                        <SelectValue placeholder={t('apiDocs.demo.card.selectChallenge')} />
                      </SelectTrigger>
                      <SelectContent data-testid="content-challenge-type">
                        <SelectItem value="random" data-testid="option-random">{t('apiDocs.demo.challengeTypes.random')}</SelectItem>
                        <SelectItem value="grid" data-testid="option-grid">{t('apiDocs.demo.challengeTypes.grid')}</SelectItem>
                        <SelectItem value="jigsaw" data-testid="option-jigsaw">{t('apiDocs.demo.challengeTypes.jigsaw')}</SelectItem>
                        <SelectItem value="gesture" data-testid="option-gesture">{t('apiDocs.demo.challengeTypes.gesture')}</SelectItem>
                        <SelectItem value="upside_down" data-testid="option-upside-down">{t('apiDocs.demo.challengeTypes.upsideDown')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {verified && (
                    <Badge variant="default" data-testid="badge-verified" className="text-xs">
                      {t('apiDocs.demo.card.verified')}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex justify-center py-4 sm:py-8 px-2 sm:px-6">
              {isDemoKeyLoading ? (
                <div className="flex items-center gap-2 sm:gap-3 p-4 sm:p-8">
                  <div className="h-6 w-6 sm:h-8 sm:w-8 animate-spin rounded-full border-3 sm:border-4 border-primary border-t-transparent" />
                  <p className="text-sm sm:text-lg font-medium">{t('apiDocs.demo.card.loading')}</p>
                </div>
              ) : demoKey ? (
                <CaptchaWidget
                  publicKey={demoKey.sitekey}
                  type={selectedType}
                  onSuccess={handleSuccess}
                  onError={(error) => {
                    toast({
                      title: t('apiDocs.demo.toast.verificationFailed'),
                      description: error,
                      variant: "destructive",
                    });
                  }}
                />
              ) : (
                <div className="flex items-center gap-2 sm:gap-3 p-4 sm:p-8 text-muted-foreground">
                  <p className="text-sm sm:text-base">{t('apiDocs.demo.card.unavailable')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="card-3d">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{t('apiDocs.demo.quickStart.title')}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{t('apiDocs.demo.quickStart.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-sm sm:text-lg font-semibold">{t('apiDocs.demo.quickStart.step1.title')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('apiDocs.demo.quickStart.step1.descriptionPart1')}{' '}
                  <Badge variant="secondary" className="mx-1 text-xs">{t('apiDocs.demo.quickStart.step1.sitekey')}</Badge>{' '}
                  {t('apiDocs.demo.quickStart.step1.descriptionPart2')}{' '}
                  <Badge variant="secondary" className="mx-1 text-xs">{t('apiDocs.demo.quickStart.step1.secretkey')}</Badge>{' '}
                  {t('apiDocs.demo.quickStart.step1.descriptionPart3')}
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-sm sm:text-lg font-semibold">{t('apiDocs.demo.quickStart.step2.title')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('apiDocs.demo.quickStart.step2.description')}
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-sm sm:text-lg font-semibold">{t('apiDocs.demo.quickStart.step3.title')}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('apiDocs.demo.quickStart.step3.description')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Frontend Integration Tab */}
        <TabsContent value="frontend" className="space-y-4">
          <Card data-testid="card-integration">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                <CardTitle>{t('apiDocs.frontend.title')}</CardTitle>
              </div>
              <CardDescription>{t('apiDocs.frontend.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html" data-testid="tabs-integration">
                <div className="overflow-x-auto -mx-3 px-3 sm:-mx-0 sm:px-0 pb-1">
                  <TabsList className="inline-flex sm:grid sm:grid-cols-2 w-auto sm:w-full gap-1 sm:gap-2">
                    <TabsTrigger value="html" data-testid="tab-html" className="whitespace-nowrap text-xs sm:text-sm px-4 sm:px-6 flex-1 sm:flex-none">
                      {t('apiDocs.frontend.tabs.html')}
                    </TabsTrigger>
                    <TabsTrigger value="react" data-testid="tab-react" className="whitespace-nowrap text-xs sm:text-sm px-4 sm:px-6 flex-1 sm:flex-none">
                      {t('apiDocs.frontend.tabs.react')}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="html" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm sm:text-base">{t('apiDocs.frontend.html.step1.title')}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('apiDocs.frontend.html.step1.description')}
                    </p>
                    <div className="overflow-auto rounded-lg">
                      <pre className="bg-muted p-3 sm:p-4 rounded-lg text-[10px] sm:text-xs font-mono whitespace-pre w-max min-w-full">
{`Sitekey: ${demoKey?.sitekey || 'pk_your_sitekey_here'}
Domain: Your website domain (e.g., example.com)`}
                      </pre>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm sm:text-base">{t('apiDocs.frontend.html.step2.title')}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('apiDocs.frontend.html.step2.description')}
                    </p>
                    <div className="overflow-auto rounded-lg">
                      <pre className="bg-muted p-3 sm:p-4 rounded-lg text-[10px] sm:text-xs font-mono whitespace-pre w-max min-w-full">
{`<script src="${window.location.origin}/proofCaptcha/api.js" async defer></script>`}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm sm:text-base">{t('apiDocs.frontend.html.step3.title')}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('apiDocs.frontend.html.step3.description')}
                    </p>
                    <div className="overflow-auto rounded-lg max-h-[400px]">
                      <pre className="bg-muted p-3 sm:p-4 rounded-lg text-[10px] sm:text-xs font-mono whitespace-pre w-max min-w-full">
{`<form id="contact-form">
  <input type="email" name="email" placeholder="Email" required>
  <textarea name="message" placeholder="Message" required></textarea>
  
  <!-- Auto-Render CAPTCHA Widget -->
  <div class="proof-captcha"
       data-sitekey="${demoKey?.sitekey || 'YOUR_SITEKEY'}"
       data-theme="light"
       data-type="random"
       data-callback="onCaptchaSuccess"
       data-error-callback="onCaptchaError">
  </div>
  
  <button type="submit">Send Message</button>
</form>

<script>
  function onCaptchaSuccess(token) {
    console.log('CAPTCHA verified:', token);
  }
  
  function onCaptchaError(error) {
    console.error('CAPTCHA error:', error);
  }
  
  document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const token = ProofCaptcha.getResponse();
    if (!token) {
      alert('Please complete CAPTCHA');
      return;
    }
    // Submit form with token
    console.log('Submitting with token:', token);
  });
</script>`}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm sm:text-base">{t('apiDocs.frontend.html.step4.title')}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('apiDocs.frontend.html.step4.description')}
                    </p>
                    <div className="overflow-auto rounded-lg">
                      <pre className="bg-muted p-3 sm:p-4 rounded-lg text-[10px] sm:text-xs font-mono whitespace-pre w-max min-w-full">
{`<div id="captcha-container"></div>

<script>
  ProofCaptcha.ready(function() {
    ProofCaptcha.render('captcha-container', {
      sitekey: '${demoKey?.sitekey || 'YOUR_SITEKEY'}',
      theme: 'light',
      type: 'random',
      callback: onCaptchaSuccess,
      'error-callback': onCaptchaError
    });
  });
</script>`}
                      </pre>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="react" className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">{t('apiDocs.frontend.react.step1.title')}</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`npm install @proofcaptcha/react
# or
yarn add @proofcaptcha/react`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">{t('apiDocs.frontend.react.step2.title')}</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`import { useState } from 'react';
import { ProofCaptcha } from '@proofcaptcha/react';

function ContactForm() {
  const [token, setToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      alert('Please complete CAPTCHA');
      return;
    }

    // Submit form with CAPTCHA token
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, captchaToken: token })
    });
    
    const result = await response.json();
    console.log(result);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
        required
      />
      
      <textarea
        value={formData.message}
        onChange={(e) => setFormData({...formData, message: e.target.value})}
        placeholder="Message"
        required
      />
      
      {/* ProofCaptcha Widget */}
      <ProofCaptcha
        publicKey="${demoKey?.sitekey || 'YOUR_SITEKEY'}"
        type="random"
        onSuccess={setToken}
        onError={(error) => console.error(error)}
      />
      
      <button type="submit" disabled={!token}>
        Send Message
      </button>
    </form>
  );
}`}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">{t('apiDocs.frontend.react.step3.title')}</h4>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`publicKey: string;          // Your sitekey (public API key)
type?: 'random' | 'grid' | 'jigsaw';  // Challenge type
onSuccess?: (token: string) => void;  // Success callback
onError?: (error: string) => void;    // Error callback`}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backend Verification Tab */}
        <TabsContent value="backend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('apiDocs.backend.title')}</CardTitle>
              <CardDescription>{t('apiDocs.backend.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert data-testid="alert-backend-required">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{t('apiDocs.backend.alert.title')}</AlertTitle>
                <AlertDescription>
                  {t('apiDocs.backend.alert.description')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-medium">{t('apiDocs.backend.tokenFlow.title')}</h4>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">{t('apiDocs.backend.tokenFlow.step1.label')}</Badge>
                    <div>
                      <strong>{t('apiDocs.backend.tokenFlow.step1.title')}</strong> {t('apiDocs.backend.tokenFlow.step1.description')}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">{t('apiDocs.backend.tokenFlow.step2.label')}</Badge>
                    <div>
                      <strong>{t('apiDocs.backend.tokenFlow.step2.title')}</strong> {t('apiDocs.backend.tokenFlow.step2.description')}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">{t('apiDocs.backend.tokenFlow.step3.label')}</Badge>
                    <div>
                      <strong>{t('apiDocs.backend.tokenFlow.step3.title')}</strong> {t('apiDocs.backend.tokenFlow.step3.description')}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">{t('apiDocs.backend.tokenFlow.step4.label')}</Badge>
                    <div>
                      <strong>{t('apiDocs.backend.tokenFlow.step4.title')}</strong> {t('apiDocs.backend.tokenFlow.step4.description', { endpoint: '/proofCaptcha/api/siteverify' })}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5">{t('apiDocs.backend.tokenFlow.step5.label')}</Badge>
                    <div>
                      <strong>{t('apiDocs.backend.tokenFlow.step5.title')}</strong> {t('apiDocs.backend.tokenFlow.step5.description')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('apiDocs.backend.tokenTypes.title')}</h4>
                <div className="grid gap-3">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Key className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-sm">{t('apiDocs.backend.tokenTypes.challenge.title')}</strong>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('apiDocs.backend.tokenTypes.challenge.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lock className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <strong className="text-sm">{t('apiDocs.backend.tokenTypes.verification.title')}</strong>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('apiDocs.backend.tokenTypes.verification.description')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('apiDocs.backend.examples.nodejs.title')}</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono" data-testid="code-backend-example">
{`app.post('/api/contact', async (req, res) => {
  const { captchaToken, email, message } = req.body;
  
  // REQUIRED: Verify CAPTCHA token with ProofCaptcha backend
  // This prevents bots from bypassing client-side checks
  const verifyResponse = await fetch('${window.location.origin}/proofCaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      response: captchaToken,  // Verification token from api.js
      secret: process.env.PROOFCAPTCHA_SECRET_KEY  // Your secret key
    })
  });
  
  const verifyResult = await verifyResponse.json();
  
  // Reject if verification fails
  if (!verifyResult.success) {
    return res.status(400).json({ 
      error: 'CAPTCHA verification failed',
      details: verifyResult['error-codes'] || 'Invalid CAPTCHA'
    });
  }
  
  // ✓ CAPTCHA verified successfully
  // Now it's safe to process the user's request
  await sendContactEmail(email, message);
  
  res.json({ 
    success: true,
    message: 'Message sent successfully' 
  });
});`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('apiDocs.backend.examples.python.title')}</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
{`import requests
import os

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json()
    captcha_token = data.get('captchaToken')
    
    # REQUIRED: Verify with ProofCaptcha backend
    verify_response = requests.post(
        '${window.location.origin}/proofCaptcha/api/siteverify',
        json={
            'response': captcha_token,  # Verification token
            'secret': os.getenv('PROOFCAPTCHA_SECRET_KEY')
        }
    )
    
    result = verify_response.json()
    
    # Reject if verification fails
    if not result.get('success'):
        return jsonify({
            'error': 'CAPTCHA verification failed',
            'details': result.get('error-codes', [])
        }), 400
    
    # ✓ Verified - process the request
    send_email(data['email'], data['message'])
    
    return jsonify({'success': True})`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('apiDocs.backend.siteverify.request')}</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono" data-testid="code-backend-request">
{`POST /proofCaptcha/api/siteverify
Content-Type: application/json

{
  "response": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // JWT verification token
  "secret": "sk_your_secret_key_here"  // Your secret key from dashboard
}`}
                </pre>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('apiDocs.backend.siteverify.response')}</h4>
                <div className="grid gap-3">
                  <div>
                    <p className="text-xs font-medium mb-2 text-green-600">{t('apiDocs.backend.siteverify.successTitle')}</p>
                    <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto" data-testid="code-backend-response">
{`{
  "success": true,
  "challenge_ts": "2024-01-15T10:30:45.123Z",
  "hostname": "example.com"
}`}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2 text-red-600">{t('apiDocs.backend.siteverify.errorTitle')}</p>
                    <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`{
  "success": false,
  "error-codes": ["invalid-input-response"]
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('apiDocs.backend.siteverify.errorCodesTitle')}</h4>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-xs">
                  <div><code>missing-input-secret</code> - {t('apiDocs.backend.siteverify.errors.missingSecret')}</div>
                  <div><code>invalid-input-secret</code> - {t('apiDocs.backend.siteverify.errors.invalidSecret')}</div>
                  <div><code>missing-input-response</code> - {t('apiDocs.backend.siteverify.errors.missingResponse')}</div>
                  <div><code>invalid-input-response</code> - {t('apiDocs.backend.siteverify.errors.invalidResponse')}</div>
                  <div><code>timeout-or-duplicate</code> - {t('apiDocs.backend.siteverify.errors.timeoutDuplicate')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card data-testid="card-security-architecture">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>{t('apiDocs.security.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('apiDocs.security.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div data-testid="pillar-crypto" className="bg-card border rounded-md p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="text-sm font-medium">
                      {t('apiDocs.security.pillars.crypto.title')}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('apiDocs.security.pillars.crypto.description')}
                  </p>
                </div>

                <div data-testid="pillar-validation" className="bg-card border rounded-md p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="text-sm font-medium">
                      {t('apiDocs.security.pillars.validation.title')}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('apiDocs.security.pillars.validation.description')}
                  </p>
                </div>

                <div data-testid="pillar-pow" className="bg-card border rounded-md p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="text-sm font-medium">
                      {t('apiDocs.security.pillars.pow.title')}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('apiDocs.security.pillars.pow.description')}
                  </p>
                </div>

                <div data-testid="pillar-fingerprint" className="bg-card border rounded-md p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-4 w-4 text-primary flex-shrink-0" />
                    <h3 className="text-sm font-medium">
                      {t('apiDocs.security.pillars.fingerprint.title')}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('apiDocs.security.pillars.fingerprint.description')}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="features" data-testid="tabs-security">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="features" data-testid="tab-features">{t('apiDocs.security.tabs.features')}</TabsTrigger>
                  <TabsTrigger value="scenarios" data-testid="tab-scenarios">{t('apiDocs.security.tabs.threatModel')}</TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="space-y-4">
                  <Accordion type="single" collapsible className="w-full" data-testid="accordion-security">
                    <AccordionItem value="fingerprinting">
                      <AccordionTrigger data-testid="trigger-fingerprinting">
                        <div className="flex items-center gap-2">
                          <Fingerprint className="h-4 w-4" />
                          <span>{t('apiDocs.security.features.fingerprinting.title')}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <p className="text-sm">
                          {t('apiDocs.security.features.fingerprinting.description')}
                        </p>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.fingerprinting.canvas.title')}</strong> {t('apiDocs.security.features.fingerprinting.canvas.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.fingerprinting.webgl.title')}</strong> {t('apiDocs.security.features.fingerprinting.webgl.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.fingerprinting.audio.title')}</strong> {t('apiDocs.security.features.fingerprinting.audio.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.fingerprinting.font.title')}</strong> {t('apiDocs.security.features.fingerprinting.font.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.fingerprinting.screen.title')}</strong> {t('apiDocs.security.features.fingerprinting.screen.description')}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="risk-scoring">
                      <AccordionTrigger data-testid="trigger-risk">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span>{t('apiDocs.security.features.riskScoring.title')}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <p className="text-sm">
                          {t('apiDocs.security.features.riskScoring.description')}
                        </p>
                        <div className="mt-3">
                          <strong>{t('apiDocs.security.features.riskScoring.factorsTitle')}</strong>
                        </div>
                        <div className="grid gap-1">
                          <div className="flex items-center justify-between p-2 bg-muted rounded">
                            <span>{t('apiDocs.security.features.riskScoring.automation')}</span>
                            <Badge variant="destructive">{t('apiDocs.security.features.riskScoring.automationPoints')}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted rounded">
                            <span>{t('apiDocs.security.features.riskScoring.highFrequency')}</span>
                            <Badge variant="destructive">{t('apiDocs.security.features.riskScoring.highFrequencyPoints')}</Badge>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-muted rounded">
                            <span>{t('apiDocs.security.features.riskScoring.failedAttempts')}</span>
                            <Badge variant="destructive">{t('apiDocs.security.features.riskScoring.failedAttemptsPoints')}</Badge>
                          </div>
                        </div>
                        <div className="mt-3">
                          <strong>{t('apiDocs.security.features.riskScoring.responseTitle')}</strong>
                        </div>
                        <div className="grid gap-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-500">{t('apiDocs.security.features.riskScoring.lowRisk')}</Badge>
                            <span>{t('apiDocs.security.features.riskScoring.lowRiskResponse')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-yellow-500">{t('apiDocs.security.features.riskScoring.mediumRisk')}</Badge>
                            <span>{t('apiDocs.security.features.riskScoring.mediumRiskResponse')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-500">{t('apiDocs.security.features.riskScoring.highRisk')}</Badge>
                            <span>{t('apiDocs.security.features.riskScoring.highRiskResponse')}</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="ip">
                      <AccordionTrigger data-testid="trigger-ip">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>{t('apiDocs.security.features.ipBlocking.title')}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <p className="text-sm">
                          {t('apiDocs.security.features.ipBlocking.description')}
                        </p>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.ipBlocking.automatic.title')}</strong> {t('apiDocs.security.features.ipBlocking.automatic.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.ipBlocking.manual.title')}</strong> {t('apiDocs.security.features.ipBlocking.manual.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.ipBlocking.rateLimit.title')}</strong> {t('apiDocs.security.features.ipBlocking.rateLimit.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.ipBlocking.cleanup.title')}</strong> {t('apiDocs.security.features.ipBlocking.cleanup.description')}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="behavioral">
                      <AccordionTrigger data-testid="trigger-behavioral">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span>{t('apiDocs.security.features.behavioral.title')}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2">
                        <p className="text-sm">
                          {t('apiDocs.security.features.behavioral.description')}
                        </p>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.behavioral.timing.title')}</strong> {t('apiDocs.security.features.behavioral.timing.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.behavioral.request.title')}</strong> {t('apiDocs.security.features.behavioral.request.description')}
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <strong>{t('apiDocs.security.features.behavioral.userAgent.title')}</strong> {t('apiDocs.security.features.behavioral.userAgent.description')}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="devtools">
                      <AccordionTrigger data-testid="trigger-devtools">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <span>{t('apiDocs.security.features.antiDebugger.title')}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3">
                        <p className="text-sm">
                          {t('apiDocs.security.features.antiDebugger.description')}
                        </p>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-destructive" />
                              <h4 className="font-medium text-sm">{t('apiDocs.security.features.antiDebugger.realtime.title')}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('apiDocs.security.features.antiDebugger.realtime.description')}
                            </p>
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>{t('apiDocs.security.features.antiDebugger.realtime.console')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>{t('apiDocs.security.features.antiDebugger.realtime.warning')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>{t('apiDocs.security.features.antiDebugger.realtime.animation')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-muted p-4 rounded-lg space-y-2">
                            <div className="flex items-center gap-2">
                              <Lock className="h-4 w-4 text-destructive" />
                              <h4 className="font-medium text-sm">{t('apiDocs.security.features.antiDebugger.integrity.title')}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t('apiDocs.security.features.antiDebugger.integrity.description')}
                            </p>
                            <div className="mt-2 space-y-1 text-xs">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>{t('apiDocs.security.features.antiDebugger.integrity.validation')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>{t('apiDocs.security.features.antiDebugger.integrity.timing')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span>{t('apiDocs.security.features.antiDebugger.integrity.script')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <Alert className="bg-destructive/10 border-destructive/20">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <AlertTitle>{t('apiDocs.security.features.antiDebugger.alert.title')}</AlertTitle>
                          <AlertDescription className="text-xs sm:text-sm">
                            {t('apiDocs.security.features.antiDebugger.alert.description')}
                          </AlertDescription>
                        </Alert>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </TabsContent>

                <TabsContent value="scenarios" className="space-y-4">
                  <Alert data-testid="alert-scenarios-info">
                    <Shield className="h-4 w-4" />
                    <AlertTitle>{t('apiDocs.security.threatModel.title')}</AlertTitle>
                    <AlertDescription>
                      {t('apiDocs.security.threatModel.description')}
                    </AlertDescription>
                  </Alert>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-testid="table-threat-scenarios">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">{t('apiDocs.security.threatModel.table.scenario')}</th>
                          <th className="text-left p-3 font-medium">{t('apiDocs.security.threatModel.table.method')}</th>
                          <th className="text-left p-3 font-medium">{t('apiDocs.security.threatModel.table.protection')}</th>
                          <th className="text-left p-3 font-medium">{t('apiDocs.security.threatModel.table.result')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b" data-testid="row-token-replay">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong>{t('apiDocs.security.threatModel.attacks.tokenReplay.title')}</strong>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {t('apiDocs.security.threatModel.attacks.tokenReplay.description')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t('apiDocs.security.threatModel.attacks.tokenReplay.mitigations').split(',').map((m: string, i: number) => (
                                <Badge key={i} variant="secondary">{m.trim()}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-green-500">{t('apiDocs.security.threatModel.attacks.tokenReplay.status')}</Badge>
                          </td>
                        </tr>

                        <tr className="border-b" data-testid="row-cross-domain">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong>{t('apiDocs.security.threatModel.attacks.crossDomain.title')}</strong>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {t('apiDocs.security.threatModel.attacks.crossDomain.description')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t('apiDocs.security.threatModel.attacks.crossDomain.mitigations').split(',').map((m: string, i: number) => (
                                <Badge key={i} variant="secondary">{m.trim()}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-green-500">{t('apiDocs.security.threatModel.attacks.crossDomain.status')}</Badge>
                          </td>
                        </tr>

                        <tr className="border-b" data-testid="row-automation">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong>{t('apiDocs.security.threatModel.attacks.botFarm.title')}</strong>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {t('apiDocs.security.threatModel.attacks.botFarm.description')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t('apiDocs.security.threatModel.attacks.botFarm.mitigations').split(',').map((m: string, i: number) => (
                                <Badge key={i} variant="secondary">{m.trim()}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-yellow-500">{t('apiDocs.security.threatModel.attacks.botFarm.status')}</Badge>
                          </td>
                        </tr>

                        <tr className="border-b" data-testid="row-tampering">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong>{t('apiDocs.security.threatModel.attacks.tampering.title')}</strong>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {t('apiDocs.security.threatModel.attacks.tampering.description')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t('apiDocs.security.threatModel.attacks.tampering.mitigations').split(',').map((m: string, i: number) => (
                                <Badge key={i} variant="secondary">{m.trim()}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-green-500">{t('apiDocs.security.threatModel.attacks.tampering.status')}</Badge>
                          </td>
                        </tr>

                        <tr className="border-b" data-testid="row-ddos">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong>{t('apiDocs.security.threatModel.attacks.ddos.title')}</strong>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {t('apiDocs.security.threatModel.attacks.ddos.description')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t('apiDocs.security.threatModel.attacks.ddos.mitigations').split(',').map((m: string, i: number) => (
                                <Badge key={i} variant="secondary">{m.trim()}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-green-500">{t('apiDocs.security.threatModel.attacks.ddos.status')}</Badge>
                          </td>
                        </tr>

                        <tr className="border-b" data-testid="row-csrf">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong>{t('apiDocs.security.threatModel.attacks.csrf.title')}</strong>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {t('apiDocs.security.threatModel.attacks.csrf.description')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t('apiDocs.security.threatModel.attacks.csrf.mitigations').split(',').map((m: string, i: number) => (
                                <Badge key={i} variant="secondary">{m.trim()}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-green-500">{t('apiDocs.security.threatModel.attacks.csrf.status')}</Badge>
                          </td>
                        </tr>

                        <tr className="border-b" data-testid="row-session-hijack">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong>{t('apiDocs.security.threatModel.attacks.sessionHijack.title')}</strong>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {t('apiDocs.security.threatModel.attacks.sessionHijack.description')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t('apiDocs.security.threatModel.attacks.sessionHijack.mitigations').split(',').map((m: string, i: number) => (
                                <Badge key={i} variant="secondary">{m.trim()}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-green-500">{t('apiDocs.security.threatModel.attacks.sessionHijack.status')}</Badge>
                          </td>
                        </tr>

                        <tr data-testid="row-solver-farms">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              <strong>{t('apiDocs.security.threatModel.attacks.solverFarms.title')}</strong>
                            </div>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {t('apiDocs.security.threatModel.attacks.solverFarms.description')}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t('apiDocs.security.threatModel.attacks.solverFarms.mitigations').split(',').map((m: string, i: number) => (
                                <Badge key={i} variant="secondary">{m.trim()}</Badge>
                              ))}
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className="bg-yellow-500">{t('apiDocs.security.threatModel.attacks.solverFarms.status')}</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <Alert className="mt-4" data-testid="alert-defense-summary">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>{t('apiDocs.security.threatModel.defenseAlert.title')}</AlertTitle>
                    <AlertDescription>
                      {t('apiDocs.security.threatModel.defenseAlert.description')}
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Best Practices Tab */}
        <TabsContent value="best-practices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <CardTitle>{t('apiDocs.bestPractices.title')}</CardTitle>
              </div>
              <CardDescription>
                {t('apiDocs.bestPractices.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {t('apiDocs.bestPractices.practices.practice1.number')}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t('apiDocs.bestPractices.practices.practice1.title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('apiDocs.bestPractices.practices.practice1.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {t('apiDocs.bestPractices.practices.practice2.number')}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t('apiDocs.bestPractices.practices.practice2.title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('apiDocs.bestPractices.practices.practice2.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {t('apiDocs.bestPractices.practices.practice3.number')}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t('apiDocs.bestPractices.practices.practice3.title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('apiDocs.bestPractices.practices.practice3.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {t('apiDocs.bestPractices.practices.practice4.number')}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t('apiDocs.bestPractices.practices.practice4.title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('apiDocs.bestPractices.practices.practice4.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {t('apiDocs.bestPractices.practices.practice5.number')}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t('apiDocs.bestPractices.practices.practice5.title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('apiDocs.bestPractices.practices.practice5.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {t('apiDocs.bestPractices.practices.practice6.number')}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t('apiDocs.bestPractices.practices.practice6.title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('apiDocs.bestPractices.practices.practice6.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {t('apiDocs.bestPractices.practices.practice7.number')}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t('apiDocs.bestPractices.practices.practice7.title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('apiDocs.bestPractices.practices.practice7.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {t('apiDocs.bestPractices.practices.practice8.number')}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{t('apiDocs.bestPractices.practices.practice8.title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('apiDocs.bestPractices.practices.practice8.description')}
                    </p>
                  </div>
                </div>
              </div>

              <Alert data-testid="alert-security-contact">
                <Shield className="h-4 w-4" />
                <AlertTitle>{t('apiDocs.bestPractices.monitoringAlert.title')}</AlertTitle>
                <AlertDescription>
                  {t('apiDocs.bestPractices.monitoringAlert.description')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </motion.div>
      </div>
    </div>
  );
}
