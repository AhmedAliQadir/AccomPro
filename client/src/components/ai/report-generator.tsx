import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setShowDialog(true);

    try {
      const response = await fetch('/api/ai/report/generate', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Failed to generate report' }));
        throw new Error(err.error);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inspection-readiness-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Report Generated', description: 'Your inspection readiness report has been downloaded.' });
    } catch (error: any) {
      toast({
        title: 'Report Failed',
        description: error.message || 'Failed to generate the report.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Inspection Readiness Report
          </CardTitle>
          <CardDescription>
            Generate a comprehensive CQC inspection readiness report using AI analysis of your compliance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generating Report</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground text-center">
              AI is analysing your compliance data and generating the report. This may take a minute...
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
