import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen" data-testid="page-terms">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">ProofCaptcha</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t('terms.title')}</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('terms.pageTitle')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('terms.lastUpdated')}: {t('terms.lastUpdatedDate')}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.agreement.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.agreement.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.description.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('terms.description.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('terms.description.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.registration.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('terms.registration.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('terms.registration.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.acceptable.title')}</h2>
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">{t('terms.acceptable.youMay.title')}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {(t('terms.acceptable.youMay.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">{t('terms.acceptable.youMayNot.title')}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {(t('terms.acceptable.youMayNot.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.apiKeys.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('terms.apiKeys.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('terms.apiKeys.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.availability.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.availability.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.rateLimits.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('terms.rateLimits.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('terms.rateLimits.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.ip.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.ip.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.privacyData.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.privacyData.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.liability.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.liability.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.indemnification.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.indemnification.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.termination.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('terms.termination.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('terms.termination.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.changesToTerms.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.changesToTerms.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.governingLaw.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.governingLaw.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.contactInfo.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.contactInfo.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('terms.severability.title')}</h2>
                <p className="text-muted-foreground">
                  {t('terms.severability.content')}
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/" className="text-primary hover:underline" data-testid="link-home">
              {t('terms.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
