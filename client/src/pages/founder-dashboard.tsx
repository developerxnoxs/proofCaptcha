import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Key, Shield, Activity, Database, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

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
