import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function KpiCard({ title, value, description, trend, trendValue, status = 'neutral', icon, onClick }: KpiCardProps) {
  const statusColor = {
    success: "text-green-500",
    warning: "text-orange-500",
    danger: "text-red-500",
    neutral: "text-muted-foreground"
  };

  return (
    <Card
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={onClick ? "cursor-pointer hover:shadow-md transition-shadow" : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {trend === 'up' && <ArrowUp className={cn("h-3 w-3", statusColor[status])} />}
            {trend === 'down' && <ArrowDown className={cn("h-3 w-3", statusColor[status])} />}
            {trend === 'neutral' && <Minus className="h-3 w-3" />}
            {trendValue && <span className={cn("font-medium", statusColor[status])}>{trendValue}</span>}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
