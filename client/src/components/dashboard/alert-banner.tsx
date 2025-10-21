import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LucideIcon, AlertCircle, AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AlertBannerProps {
  variant?: "info" | "warning" | "error" | "success";
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  testId?: string;
}

export function AlertBanner({
  variant = "info",
  title,
  description,
  icon,
  action,
  dismissible = false,
  onDismiss,
  testId,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const variantConfig = {
    info: {
      className: "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20 text-blue-900 dark:text-blue-100",
      icon: Info,
    },
    warning: {
      className: "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-100",
      icon: AlertTriangle,
    },
    error: {
      className: "border-red-500/50 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-100",
      icon: AlertCircle,
    },
    success: {
      className: "border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-100",
      icon: CheckCircle2,
    },
  };

  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) {
    return null;
  }

  return (
    <Alert className={cn("border-l-4", config.className)} data-testid={testId}>
      <Icon className="h-5 w-5" />
      <div className="flex-1">
        <AlertTitle>{title}</AlertTitle>
        {description && <AlertDescription>{description}</AlertDescription>}
      </div>
      <div className="flex items-center gap-2">
        {action && (
          <Button
            size="sm"
            variant="outline"
            onClick={action.onClick}
            data-testid={testId ? `${testId}-action` : undefined}
          >
            {action.label}
          </Button>
        )}
        {dismissible && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            data-testid={testId ? `${testId}-dismiss` : undefined}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
