import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    initials: string;
  };
  action: string;
  details?: string;
  timestamp: Date | string;
  type?: "incident" | "document" | "compliance" | "property" | "resident" | "default";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxHeight?: string;
  onItemClick?: (activity: ActivityItem) => void;
  testId?: string;
}

export function ActivityFeed({
  activities,
  title = "Recent Activity",
  maxHeight = "h-96",
  onItemClick,
  testId,
}: ActivityFeedProps) {
  const getActivityColor = (type?: ActivityItem["type"]) => {
    switch (type) {
      case "incident":
        return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300";
      case "document":
        return "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300";
      case "compliance":
        return "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300";
      case "property":
        return "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300";
      case "resident":
        return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className={maxHeight}>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
              </div>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex gap-4 p-4 rounded-lg transition-colors border-b last:border-b-0",
                    onItemClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onItemClick?.(activity)}
                  data-testid={testId ? `${testId}-item-${index}` : undefined}
                >
                  <Avatar className={cn("w-10 h-10", getActivityColor(activity.type))}>
                    <AvatarFallback>{activity.user.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(
                          typeof activity.timestamp === 'string' 
                            ? new Date(activity.timestamp) 
                            : activity.timestamp, 
                          { addSuffix: true }
                        )}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {activity.details}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
