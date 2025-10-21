import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
  };
  variant?: "default" | "success" | "warning" | "error";
  onClick?: () => void;
  testId?: string;
}

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  onClick,
  testId,
}: StatCardProps) {
  const variantStyles = {
    default: "bg-background",
    success: "bg-green-50/50 dark:bg-green-950/20",
    warning: "bg-amber-50/50 dark:bg-amber-950/20",
    error: "bg-red-50/50 dark:bg-red-950/20",
  };

  const iconColorStyles = {
    default: "bg-muted text-muted-foreground",
    success: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
    warning: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
    error: "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400",
  };

  const trendColor = trend
    ? trend.value > 0
      ? "text-green-600 dark:text-green-400"
      : trend.value < 0
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground"
    : "";

  const TrendIcon = trend
    ? trend.value > 0
      ? ArrowUp
      : trend.value < 0
        ? ArrowDown
        : Minus
    : null;

  const content = (
    <>
      <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={cn("p-2 rounded-lg", iconColorStyles[variant])}>
                  <Icon className="w-6 h-6" />
                </div>
              )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {label}
              </p>
            </div>
          </div>
          {trend && TrendIcon && (
            <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
              <TrendIcon className="w-4 h-4" />
              <span className="font-medium">
                {Math.abs(trend.value)}%
              </span>
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-3xl font-bold" data-testid={testId ? `${testId}-value` : undefined}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend?.label && (
            <p className="text-xs text-muted-foreground mt-1">{trend.label}</p>
          )}
        </div>
      </CardContent>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="text-left w-full"
        data-testid={testId}
      >
        <Card className={cn("min-h-32 transition-all hover-elevate active-elevate-2", variantStyles[variant])}>
          {content}
        </Card>
      </button>
    );
  }

  return (
    <Card className={cn("min-h-32", variantStyles[variant])} data-testid={testId}>
      {content}
    </Card>
  );
}
