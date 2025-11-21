import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Key, Shield, Activity, Database, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Server, Globe } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { formatDistanceToNow } from "date-fns";

interface FounderStats {
  totalDevelopers: number;
  totalApiKeys: number;
  totalChallenges: number;
  totalVerifications: number;
  successRate: number;
  activeDevelopers: number;
}

interface TimeSeriesData {
  time: string;
  success: number;
  failed: number;
}

interface ChallengeTypeData {
  label: string;
  value: number;
}

interface ActivityLog {
  id: string;
  type: string;
  description: string;
  developer: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  apiKey: {
    id: string;
    name: string;
    domain: string | null;
  } | null;
  metadata: {
    country: string | null;
    city: string | null;
    ipAddress: string | null;
    timeToSolve: number | null;
  };
  timestamp: string;
}

interface SystemHealth {
  status: string;
  uptime: number;
  timestamp: string;
  metrics: {
    developers: {
      total: number;
      verified: number;
      unverified: number;
    };
    apiKeys: {
      total: number;
      active: number;
      inactive: number;
    };
    verifications: {
      lastHour: number;
      last24Hours: number;
      successRate24h: number;
      avgSolveTime: number;
    };
    challenges: {
      total: number;
      active: number;
      used: number;
    };
  };
}

interface TopDeveloper {
  developer: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    company: string | null;
  };
  apiKeysCount: number;
  totalVerifications: number;
  successfulVerifications: number;
  successRate: number;
}

interface ApiKeyOverview {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
  theme: string;
  developer: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  stats: {
    totalVerifications: number;
    successfulVerifications: number;
    successRate: number;
    last24hVerifications: number;
  };
  createdAt: string;
}

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function FounderDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<FounderStats>({
    queryKey: ["/api/founder/stats"],
  });

  const { data: timeseries, isLoading: timeseriesLoading } = useQuery<TimeSeriesData[]>({
    queryKey: ["/api/founder/timeseries"],
  });

  const { data: challengeTypes, isLoading: challengeTypesLoading } = useQuery<ChallengeTypeData[]>({
    queryKey: ["/api/founder/challenge-types"],
  });

  const { data: activityLog, isLoading: activityLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/founder/activity-log"],
  });

  const { data: systemHealth, isLoading: healthLoading } = useQuery<SystemHealth>({
    queryKey: ["/api/founder/system-health"],
    refetchInterval: 30000,
  });

  const { data: topDevelopers, isLoading: topDevsLoading } = useQuery<TopDeveloper[]>({
    queryKey: ["/api/founder/top-developers"],
  });

  const { data: apiKeysOverview, isLoading: apiKeysLoading } = useQuery<ApiKeyOverview[]>({
    queryKey: ["/api/founder/api-keys-overview"],
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-founder-dashboard-title">Founder Dashboard</h2>
          <p className="text-muted-foreground" data-testid="text-founder-dashboard-subtitle">
            Complete system overview and management
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/founder/developers">
            <Button variant="default" data-testid="button-manage-developers">
              <Users className="w-4 h-4 mr-2" />
              Manage Developers
            </Button>
          </Link>
          <Link href="/founder/database">
            <Button variant="outline" data-testid="button-database-operations">
              <Database className="w-4 h-4 mr-2" />
              Database Operations
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card data-testid="card-total-developers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Developers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-developers">{stats?.totalDevelopers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeDevelopers || 0} active developers
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-api-keys">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Keys</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-api-keys">{stats?.totalApiKeys || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all developers
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-challenges">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Challenges</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-challenges">{stats?.totalChallenges || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Generated challenges
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-total-verifications">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Verifications</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-total-verifications">{stats?.totalVerifications || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Verification attempts
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-success-rate">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold" data-testid="text-success-rate">
                  {stats?.successRate ? `${stats.successRate.toFixed(1)}%` : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall system success rate
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card data-testid="card-verification-timeline">
          <CardHeader>
            <CardTitle>Verification Timeline</CardTitle>
            <CardDescription>
              Last 24 hours verification activity
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {timeseriesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeseries || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="time"
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Success"
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-challenge-types-distribution">
          <CardHeader>
            <CardTitle>Challenge Types Distribution</CardTitle>
            <CardDescription>
              Distribution by challenge type
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {challengeTypesLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={challengeTypes || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--chart-1))"
                    dataKey="value"
                  >
                    {(challengeTypes || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Health & Top Developers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* System Health */}
        <Card data-testid="card-system-health">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Health
            </CardTitle>
            <CardDescription>Real-time system status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {healthLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : systemHealth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={systemHealth.status === 'healthy' ? 'default' : 'destructive'} data-testid="badge-system-status">
                    {systemHealth.status === 'healthy' ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <XCircle className="w-3 h-3 mr-1" />
                    )}
                    {systemHealth.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Verifications (1h)</p>
                    <p className="text-xl font-bold" data-testid="text-verifications-1h">{systemHealth.metrics.verifications.lastHour}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Verifications (24h)</p>
                    <p className="text-xl font-bold" data-testid="text-verifications-24h">{systemHealth.metrics.verifications.last24Hours}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Success Rate (24h)</p>
                    <p className="text-xl font-bold" data-testid="text-success-rate-24h">
                      {systemHealth.metrics.verifications.successRate24h.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Solve Time</p>
                    <p className="text-xl font-bold" data-testid="text-avg-solve-time">
                      {(systemHealth.metrics.verifications.avgSolveTime / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Active Keys</p>
                      <p className="font-semibold">{systemHealth.metrics.apiKeys.active}/{systemHealth.metrics.apiKeys.total}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Verified Devs</p>
                      <p className="font-semibold">{systemHealth.metrics.developers.verified}/{systemHealth.metrics.developers.total}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Active Challenges</p>
                      <p className="font-semibold">{systemHealth.metrics.challenges.active}/{systemHealth.metrics.challenges.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* Top Developers */}
        <Card data-testid="card-top-developers">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Developers
            </CardTitle>
            <CardDescription>Most active developers by verifications</CardDescription>
          </CardHeader>
          <CardContent>
            {topDevsLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="space-y-3">
                {topDevelopers && topDevelopers.length > 0 ? (
                  topDevelopers.map((dev, index) => (
                    <div key={dev.developer.id} className="flex items-center gap-3" data-testid={`developer-${index}`}>
                      <div className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={dev.developer.avatar || undefined} />
                        <AvatarFallback>{dev.developer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{dev.developer.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{dev.developer.company || dev.developer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{dev.totalVerifications}</p>
                        <p className="text-xs text-muted-foreground">{dev.successRate.toFixed(0)}% success</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No developer activity yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* API Keys Overview */}
      <Card data-testid="card-api-keys-overview">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Active API Keys
          </CardTitle>
          <CardDescription>Most active API keys in the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeysLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="space-y-3">
              {apiKeysOverview && apiKeysOverview.length > 0 ? (
                apiKeysOverview.map((apiKey) => (
                  <div key={apiKey.id} className="flex items-center gap-3 p-3 rounded-md hover-elevate" data-testid={`api-key-${apiKey.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{apiKey.name}</p>
                        <Badge variant={apiKey.isActive ? 'default' : 'secondary'} className="text-xs">
                          {apiKey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {apiKey.developer && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={apiKey.developer.avatar || undefined} />
                              <AvatarFallback className="text-xs">{apiKey.developer.name.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{apiKey.developer.name}</span>
                          </div>
                        )}
                        {apiKey.domain && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground truncate">{apiKey.domain}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{apiKey.stats.last24hVerifications}</p>
                      <p className="text-xs text-muted-foreground">last 24h</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{apiKey.stats.successRate.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">success</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No API keys found</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Log */}
      <Card data-testid="card-activity-log">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest system activities and events</CardDescription>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="space-y-2">
              {activityLog && activityLog.length > 0 ? (
                activityLog.slice(0, 15).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-md hover-elevate" data-testid={`activity-${activity.id}`}>
                    <div className="mt-1">
                      {activity.type === 'verification_success' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {activity.developer && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={activity.developer.avatar || undefined} />
                              <AvatarFallback className="text-xs">{activity.developer.name.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground">{activity.developer.name}</span>
                          </div>
                        )}
                        {activity.metadata.country && (
                          <Badge variant="outline" className="text-xs">
                            {activity.metadata.country}
                          </Badge>
                        )}
                        {activity.metadata.timeToSolve && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {(activity.metadata.timeToSolve / 1000).toFixed(1)}s
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/founder/developers">
            <Button variant="outline" data-testid="button-view-all-developers">
              <Users className="w-4 h-4 mr-2" />
              View All Developers
            </Button>
          </Link>
          <Link href="/founder/database">
            <Button variant="outline" data-testid="button-manage-database">
              <Database className="w-4 h-4 mr-2" />
              Manage Database
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
