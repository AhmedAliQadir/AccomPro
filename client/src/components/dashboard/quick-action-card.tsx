import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "primary" | "success" | "warning";
  testId?: string;
  badge?: string | number;
}

export function QuickActionCard({
  label,
  description,
  icon: Icon,
  onClick,
  variant = "default",
  testId,
  badge,
}: QuickActionCardProps) {
  const variantStyles = {
    default: "border-muted hover:border-primary",
    primary: "border-primary/20 bg-primary/5 hover:bg-primary/10",
    success: "border-green-500/20 bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30",
    warning: "border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-950/30",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-center"
      data-testid={testId}
    >
      <Card className={cn("transition-all hover-elevate active-elevate-2 border-2 relative", variantStyles[variant])}>
        <CardContent className="p-6 flex flex-col items-center text-center gap-3">
          {badge !== undefined && badge !== null && (
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                {badge}
              </span>
            </div>
          )}
          <div className="p-4 rounded-full bg-background">
            <Icon className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-semibold">{label}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
