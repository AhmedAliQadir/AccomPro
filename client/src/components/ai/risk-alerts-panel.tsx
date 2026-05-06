import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Check, Shield } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface RiskAlert {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  recommendation?: string;
  isAcknowledged: boolean;
  createdAt: string;
}

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-blue-100 text-blue-800 border-blue-200',
};

const severityVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CRITICAL: 'destructive',
  HIGH: 'destructive',
  MEDIUM: 'secondary',
  LOW: 'outline',
};

export function RiskAlertsPanel() {
  const { toast } = useToast();

  const { data } = useQuery<{ alerts: RiskAlert[] }>({
    queryKey: ['/api/ai/alerts?acknowledged=false'],
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest('PATCH', `/api/ai/alerts/${alertId}/acknowledge`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai/alerts?acknowledged=false'] });
      toast({ title: 'Alert Acknowledged' });
    },
  });

  const alerts = data?.alerts || [];

  if (alerts.length === 0) return null;

  return (
    <Card className="border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-orange-600" />
          Risk Alerts
        </CardTitle>
        <CardDescription>
          {alerts.length} unacknowledged alert{alerts.length !== 1 ? 's' : ''} detected by AI analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.slice(0, 5).map(alert => (
            <div
              key={alert.id}
              className={`rounded-lg border p-3 ${severityColors[alert.severity] || 'bg-muted'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-sm">{alert.title}</span>
                    <Badge variant={severityVariant[alert.severity] || 'outline'} className="text-xs">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs ml-6">{alert.description}</p>
                  {alert.recommendation && (
                    <p className="text-xs ml-6 mt-1 font-medium">
                      Action: {alert.recommendation}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 h-7 text-xs"
                  onClick={() => acknowledgeMutation.mutate(alert.id)}
                  disabled={acknowledgeMutation.isPending}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Ack
                </Button>
              </div>
            </div>
          ))}
          {alerts.length > 5 && (
            <p className="text-xs text-muted-foreground text-center">
              +{alerts.length - 5} more alert{alerts.length - 5 !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
