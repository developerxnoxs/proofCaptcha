import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, BarChart3, Code2, Lock, Cpu, CheckCircle2, ArrowRight, Sparkles, Globe, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative overflow-hidden" data-testid="page-home">
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Header with glassmorphism */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <Shield className="h-7 w-7 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md group-hover:blur-lg transition-all" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              ProofCaptcha
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16 space-y-16 sm:space-y-20 lg:space-y-32">
        {/* Hero Section with 3D elements */}
        <section className="text-center space-y-6 sm:space-y-8 py-8 sm:py-12 lg:py-20 relative">
          {/* Floating 3D icon */}
          <div className="flex justify-center mb-6 sm:mb-8 perspective-1000">
            <div className="relative transform-gpu hover:scale-110 transition-all duration-500 floating">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-purple-500/50 rounded-3xl blur-2xl opacity-60 animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-primary to-purple-600 p-6 sm:p-8 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
                <Shield className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-white drop-shadow-lg" data-testid="icon-hero" />
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight" data-testid="text-hero-title">
              <span aria-label={t('home.title')}>
                {t('home.title').split('').map((char, index) => (
                  <span
                    key={index}
                    className="bounce-letter bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent"
                    style={{
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto px-4 leading-relaxed" data-testid="text-hero-subtitle">
              {t('home.subtitle')}
            </p>
          </div>

          <div className="flex gap-4 sm:gap-6 justify-center flex-wrap px-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="text-base sm:text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden" data-testid="button-get-started">
                <span className="relative z-10 flex items-center gap-2">
                  {t('home.getStarted')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 py-6 rounded-xl backdrop-blur-sm bg-background/50 hover:bg-background/80 border-2 shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-login">
                {t('home.login')}
              </Button>
            </Link>
          </div>

          {/* Stats badges */}
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center pt-8 sm:pt-12">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border shadow-sm" data-testid="badge-uptime">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium">{t('home.stats.uptime')}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border shadow-sm" data-testid="badge-developers">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{t('home.stats.developers')}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-sm border shadow-sm" data-testid="badge-integration">
              <Code2 className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium">{t('home.stats.integration')}</span>
            </div>
          </div>
        </section>

        {/* Features Grid with 3D cards */}
        <section className="space-y-8 sm:space-y-12">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent" data-testid="text-features-title">
                {t('home.features.title')}
              </h2>
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto" data-testid="text-features-subtitle">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="group hover-elevate relative overflow-hidden border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl" data-testid="card-feature-pow">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="p-3 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Cpu className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">{t('home.features.pow.title')}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t('home.features.pow.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover-elevate relative overflow-hidden border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl" data-testid="card-feature-analytics">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-500">
                  <BarChart3 className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-xl font-bold">{t('home.features.analytics.title')}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t('home.features.analytics.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover-elevate relative overflow-hidden border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl" data-testid="card-feature-integration">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="p-3 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Code2 className="h-8 w-8 text-green-500" />
                </div>
                <CardTitle className="text-xl font-bold">{t('home.features.integration.title')}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t('home.features.integration.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover-elevate relative overflow-hidden border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl" data-testid="card-feature-encryption">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="p-3 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Lock className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-xl font-bold">{t('home.features.encryption.title')}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t('home.features.encryption.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover-elevate relative overflow-hidden border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl" data-testid="card-feature-fingerprint">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="p-3 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Zap className="h-8 w-8 text-violet-500" />
                </div>
                <CardTitle className="text-xl font-bold">{t('home.features.fingerprint.title')}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t('home.features.fingerprint.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover-elevate relative overflow-hidden border-2 transition-all duration-500 hover:scale-105 hover:shadow-2xl" data-testid="card-feature-detection">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className="p-3 bg-gradient-to-br from-rose-500/10 to-pink-500/10 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform duration-500">
                  <Shield className="h-8 w-8 text-rose-500" />
                </div>
                <CardTitle className="text-xl font-bold">{t('home.features.detection.title')}</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {t('home.features.detection.description')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section with gradient and 3D effect */}
        <section className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-600 to-blue-600 opacity-90" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative p-8 sm:p-12 lg:p-16 text-center space-y-6 sm:space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white drop-shadow-lg" data-testid="text-cta-title">
                {t('home.cta.title')}
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/90 max-w-2xl mx-auto px-4 leading-relaxed drop-shadow" data-testid="text-cta-subtitle">
                {t('home.cta.description')}
              </p>
            </div>
            
            <Link href="/register">
              <Button 
                size="lg" 
                variant="secondary"
                className="text-base sm:text-lg px-10 py-7 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group bg-white text-primary hover:bg-white/90" 
                data-testid="button-cta"
              >
                <span className="flex items-center gap-2">
                  {t('home.cta.button')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </Link>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-6 justify-center pt-8 text-white/80 text-sm">
              <div className="flex items-center gap-2" data-testid="trust-free-start">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('home.trust.freeToStart')}</span>
              </div>
              <div className="flex items-center gap-2" data-testid="trust-no-credit-card">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('home.trust.noCreditCard')}</span>
              </div>
              <div className="flex items-center gap-2" data-testid="trust-quick-setup">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('home.trust.quickSetup')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer spacing */}
        <div className="h-8" />
      </div>
    </div>
  );
}
