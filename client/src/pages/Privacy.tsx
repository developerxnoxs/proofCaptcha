import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import LanguageToggle from "@/components/LanguageToggle";
import ThemeToggle from "@/components/ThemeToggle";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen" data-testid="page-privacy">
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
            <h1 className="text-3xl font-bold">{t('privacy.title')}</h1>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('privacy.pageTitle')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('privacy.lastUpdated')}: {t('privacy.lastUpdatedDate')}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.introduction.title')}</h2>
                <p className="text-muted-foreground">
                  {t('privacy.introduction.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.infoCollect.title')}</h2>
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">{t('privacy.infoCollect.technical.title')}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {(t('privacy.infoCollect.technical.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">{t('privacy.infoCollect.interaction.title')}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {(t('privacy.infoCollect.interaction.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">{t('privacy.infoCollect.developer.title')}</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {(t('privacy.infoCollect.developer.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.howWeUse.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('privacy.howWeUse.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('privacy.howWeUse.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.dataSecurity.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('privacy.dataSecurity.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('privacy.dataSecurity.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.dataRetention.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('privacy.dataRetention.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('privacy.dataRetention.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.thirdParty.title')}</h2>
                <p className="text-muted-foreground">
                  {t('privacy.thirdParty.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.cookies.title')}</h2>
                <p className="text-muted-foreground">
                  {t('privacy.cookies.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.yourRights.title')}</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>{t('privacy.yourRights.intro')}</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {(t('privacy.yourRights.items', { returnObjects: true }) as string[]).map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.children.title')}</h2>
                <p className="text-muted-foreground">
                  {t('privacy.children.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.changes.title')}</h2>
                <p className="text-muted-foreground">
                  {t('privacy.changes.content')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">{t('privacy.contact.title')}</h2>
                <p className="text-muted-foreground">
                  {t('privacy.contact.content')}
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/" className="text-primary hover:underline" data-testid="link-home">
              {t('privacy.backToHome')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
