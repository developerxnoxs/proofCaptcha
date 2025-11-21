import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, TrendingUp, Users, Clock, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CountryAnalytics {
  country: string;
  countryName: string;
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  successRate: string;
  uniqueIps: number;
  averageTimeToSolve: number | null;
}

interface CountryAnalyticsCardProps {
  data: CountryAnalytics[];
  isLoading?: boolean;
}

const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode === 'Unknown' || countryCode === 'XX') return '🌐';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export default function CountryAnalyticsCard({ data, isLoading }: CountryAnalyticsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Country Analytics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader className="gap-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Country Analytics
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MapPin className="h-12 w-12 mb-2 opacity-50" />
            <p>No country data available yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-country-analytics">
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Verifications by Country
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            Top {data.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {data.map((country, index) => (
              <div
                key={country.country}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 dark:bg-muted border border-border hover-elevate"
                data-testid={`country-item-${country.country}`}
              >
                <div className="text-3xl flex-shrink-0">
                  {getCountryFlag(country.country)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-foreground truncate">
                      {country.countryName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {country.country}
                    </Badge>
                    {index < 3 && (
                      <Badge className="text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                        #{index + 1}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span className="truncate">{country.totalVerifications} total</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span className="truncate">{country.uniqueIps} IPs</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <span className={`font-medium ${
                        parseFloat(country.successRate) >= 80 
                          ? 'text-green-600 dark:text-green-400' 
                          : parseFloat(country.successRate) >= 50 
                          ? 'text-yellow-600 dark:text-yellow-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {country.successRate}
                      </span>
                      <span className="text-muted-foreground text-xs">success</span>
                    </div>
                    
                    {country.averageTimeToSolve && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        <span className="truncate">{(country.averageTimeToSolve / 1000).toFixed(1)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
