import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Shield, CheckCircle, XCircle, Clock, Users, Filter, Activity, TrendingUp, Zap, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CircularProgress from "@/components/CircularProgress";
import TimeSeriesChart from "@/components/TimeSeriesChart";
import BarChartCard from "@/components/BarChartCard";
import CountryAnalyticsCard from "@/components/CountryAnalyticsCard";
import type { ApiKey } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface Stats {
  totalApiKeys: number;
  activeApiKeys: number;
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  successRate: string;
  uniqueIps: number;
  avgTimeToSolve: number;
}

interface TimeSeriesData {
  time: string;
  success: number;
  failed: number;
  total: number;
}

interface ChallengeTypeData {
  label: string;
  value: number;
}

interface CountryAnalyticsData {
  country: string;
  countryName: string;
  totalVerifications: number;
  successfulVerifications: number;
  failedVerifications: number;
  successRate: string;
  uniqueIps: number;
  averageTimeToSolve: number | null;
}

export default function Dashboard() {
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<string>("all");
  const { t } = useTranslation();

  const { data: apiKeys, isLoading: apiKeysLoading } = useQuery<ApiKey[]>({
    queryKey: ["/api/keys"],
  });

  const statsUrl = selectedApiKeyId === "all" 
    ? "/api/admin/stats"
    : `/api/admin/stats?apiKeyId=${selectedApiKeyId}`;

  const timeseriesUrl = selectedApiKeyId === "all"
    ? "/api/admin/timeseries"
    : `/api/admin/timeseries?apiKeyId=${selectedApiKeyId}`;

  const challengeTypesUrl = selectedApiKeyId === "all"
    ? "/api/admin/challenge-types"
    : `/api/admin/challenge-types?apiKeyId=${selectedApiKeyId}`;

  const countryAnalyticsUrl = selectedApiKeyId === "all"
    ? "/api/admin/country-analytics?limit=20"
    : `/api/admin/country-analytics?apiKeyId=${selectedApiKeyId}&limit=20`;

  // Auto-refresh every 5 seconds for real-time data
  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: [statsUrl],
    refetchInterval: 5000,
  });

  const { data: timeseriesData, isLoading: timeseriesLoading } = useQuery<TimeSeriesData[]>({
    queryKey: [timeseriesUrl],
    refetchInterval: 5000,
  });

  const { data: challengeTypesData, isLoading: challengeTypesLoading } = useQuery<ChallengeTypeData[]>({
    queryKey: [challengeTypesUrl],
    refetchInterval: 10000,
  });

  const { data: countryAnalyticsData, isLoading: countryAnalyticsLoading } = useQuery<CountryAnalyticsData[]>({
    queryKey: [countryAnalyticsUrl],
    refetchInterval: 10000,
  });

  if (apiKeysLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
            <div className="absolute inset-0 h-16 w-16 animate-ping rounded-full border-4 border-purple-500 opacity-20" />
          </div>
          <p className="text-muted-foreground font-medium">{t('dashboard.loadingDashboard')}</p>
        </motion.div>
      </div>
    );
  }

  const totalVerifications = stats?.totalVerifications || 0;
  const successRate = parseFloat(stats?.successRate || "0");
  // Calculate failed rate properly - only show percentage if there are verifications
  const failedRate = totalVerifications > 0 
    ? ((stats?.failedVerifications || 0) / totalVerifications) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[100px] md:blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[350px] md:w-[500px] h-[350px] md:h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] md:blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-pink-500/5 dark:bg-pink-500/10 rounded-full blur-[80px] md:blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-4 sm:space-y-6" data-testid="page-dashboard">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg shadow-lg shadow-purple-500/30">
                <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground" data-testid="text-title">
                {t('dashboard.title')}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-2 ml-8 sm:ml-11 lg:ml-14" data-testid="text-subtitle">
              <span className="hidden sm:inline">{t('dashboard.subtitle')}</span>
              <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-green-500/20 text-green-400 dark:text-green-300 border border-green-500/30">
                <Activity className="h-2.5 w-2.5 sm:h-3 sm:w-3 animate-pulse" />
                <span className="text-[10px] sm:text-xs">{t('dashboard.realtime')}</span>
              </span>
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full lg:w-auto lg:min-w-[280px]"
            data-testid="container-filter"
          >
            <Card className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-purple-500/20 rounded-lg">
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" data-testid="icon-filter" />
                  </div>
                  <div className="flex-1 space-y-1 sm:space-y-1.5">
                    <Label htmlFor="api-key-filter" className="text-xs text-muted-foreground">
                      {t('dashboard.filterByApiKey')}
                    </Label>
                    <Select value={selectedApiKeyId} onValueChange={setSelectedApiKeyId}>
                      <SelectTrigger id="api-key-filter" data-testid="select-api-key-filter" className="h-8 sm:h-9">
                        <SelectValue placeholder={t('dashboard.filterByApiKey')} />
                      </SelectTrigger>
                      <SelectContent data-testid="content-api-key-filter">
                        <SelectItem value="all" data-testid="option-all-keys">{t('dashboard.allApiKeys')}</SelectItem>
                        {apiKeys?.map((key) => (
                          <SelectItem key={key.id} value={key.id} data-testid={`option-key-${key.id}`}>
                            {key.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
          {/* Left Section - Stats Cards */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-6">
            {/* Top Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -8, rotateX: 5, rotateY: 5, scale: 1.02 }}
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              >
                <Card className="overflow-hidden group hover-elevate transition-all shadow-lg hover:shadow-xl card-3d" data-testid="card-total-verifications">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-4 sm:p-6 relative">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 bg-purple-500/20 dark:bg-purple-500/30 rounded-xl shadow-md">
                        <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.cards.totalVerifications')}</p>
                      <p className="text-2xl sm:text-4xl font-bold text-foreground">{totalVerifications.toLocaleString()}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{t('dashboard.cards.allTimeChallenges')}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -8, rotateX: 5, rotateY: -5, scale: 1.02 }}
                style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
              >
                <Card className="overflow-hidden group hover-elevate transition-all shadow-lg hover:shadow-xl card-3d" data-testid="card-avg-time">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-4 sm:p-6 relative">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="p-2 sm:p-3 bg-blue-500/20 dark:bg-blue-500/30 rounded-xl shadow-md">
                        <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="text-xs sm:text-sm text-muted-foreground">{t('dashboard.cards.avgSolveTime')}</p>
                      <p className="text-2xl sm:text-4xl font-bold text-foreground">{stats?.avgTimeToSolve || 0}<span className="text-base sm:text-xl text-muted-foreground">ms</span></p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{t('dashboard.cards.averageResponse')}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Time Series Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.01, y: -4 }}
            >
              <Card className="shadow-lg hover:shadow-xl transition-all card-3d" data-testid="card-timeseries">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                      {t('dashboard.cards.verificationsTimeline')}
                    </CardTitle>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">{t('dashboard.cards.last24Hours')}</span>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  {!timeseriesLoading && timeseriesData ? (
                    <TimeSeriesChart
                      data={timeseriesData.map(d => ({ time: d.time, value: d.total }))}
                      title=""
                      color="rgb(168, 85, 247)"
                      height={window.innerWidth < 640 ? 200 : 280}
                    />
                  ) : (
                    <div className="h-[200px] sm:h-[280px] flex items-center justify-center text-muted-foreground">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-purple-500 border-t-transparent" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Bottom Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.03, rotateY: 5, y: -4 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="hover-elevate transition-all shadow-md hover:shadow-lg card-3d">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 sm:p-2.5 bg-green-500/20 dark:bg-green-500/30 rounded-lg shadow-sm">
                        <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{stats?.activeApiKeys || 0}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('dashboard.cards.activeApiKeys')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.03, rotateY: 5, y: -4 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="hover-elevate transition-all shadow-md hover:shadow-lg card-3d">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 sm:p-2.5 bg-cyan-500/20 dark:bg-cyan-500/30 rounded-lg shadow-sm">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{stats?.uniqueIps || 0}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('dashboard.cards.uniqueVisitors')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.03, rotateY: 5, y: -4 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="hover-elevate transition-all shadow-md hover:shadow-lg card-3d">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="p-2 sm:p-2.5 bg-red-500/20 dark:bg-red-500/30 rounded-lg shadow-sm">
                        <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-xl sm:text-2xl font-bold text-foreground">{stats?.failedVerifications || 0}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">{t('dashboard.cards.failedAttempts')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Right Section - Circular Progress */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4">
            {/* Success Rate */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, rotateX: -5, y: -4 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Card className="shadow-lg hover:shadow-xl transition-all card-3d" data-testid="card-success-rate">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                    {t('dashboard.cards.successRate')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pb-4 sm:pb-6">
                  <CircularProgress
                    value={successRate}
                    max={100}
                    size={window.innerWidth < 640 ? 140 : 160}
                    strokeWidth={12}
                    label=""
                    subLabel={`${stats?.successfulVerifications || 0} ${t('dashboard.cards.successful')}`}
                    color="rgb(34, 197, 94)"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Failed Rate */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02, rotateX: -5, y: -4 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Card className="shadow-lg hover:shadow-xl transition-all card-3d">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-2">
                    <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600 dark:text-red-400" />
                    {t('dashboard.cards.failureRate')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pb-4 sm:pb-6">
                  <CircularProgress
                    value={failedRate}
                    max={100}
                    size={window.innerWidth < 640 ? 140 : 160}
                    strokeWidth={12}
                    label=""
                    subLabel={`${stats?.failedVerifications || 0} ${t('dashboard.cards.failed')}`}
                    color="rgb(239, 68, 68)"
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Challenge Types */}
            {!challengeTypesLoading && challengeTypesData && challengeTypesData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02, y: -4 }}
              >
                <Card className="shadow-lg hover:shadow-xl transition-all card-3d">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="text-xs sm:text-sm font-medium text-foreground">{t('dashboard.cards.challengeTypes')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5 sm:space-y-3">
                      {challengeTypesData.slice(0, 5).map((item, idx) => (
                        <div key={item.label} className="space-y-1 sm:space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="text-foreground font-medium">{item.value}</span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full shadow-sm"
                              style={{
                                background: `linear-gradient(90deg, ${
                                  ['rgb(168, 85, 247)', 'rgb(59, 130, 246)', 'rgb(34, 197, 94)', 'rgb(234, 179, 8)', 'rgb(239, 68, 68)'][idx % 5]
                                }, ${
                                  ['rgb(139, 92, 246)', 'rgb(96, 165, 250)', 'rgb(74, 222, 128)', 'rgb(250, 204, 21)', 'rgb(248, 113, 113)'][idx % 5]
                                })`
                              }}
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min((item.value / (challengeTypesData[0]?.value || 1)) * 100, 100)}%`
                              }}
                              transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Country Analytics Section - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.005, y: -4 }}
          className="lg:col-span-12"
        >
          <div className="shadow-lg hover:shadow-xl transition-all rounded-lg card-3d">
            <CountryAnalyticsCard 
              data={countryAnalyticsData ?? []} 
              isLoading={countryAnalyticsLoading} 
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
