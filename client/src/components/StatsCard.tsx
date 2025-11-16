import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
}

export default function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card data-testid={`card-stats-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" data-testid="icon-stats" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" data-testid="text-value">
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1" data-testid="text-description">
            {description}
          </p>
        )}
        {trend && (
          <p
            className={`text-xs mt-1 ${trend.value >= 0 ? "text-green-600" : "text-destructive"}`}
            data-testid="text-trend"
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
