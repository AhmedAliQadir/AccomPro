import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReviewResult {
  review: string;
  fileName: string;
  fileSize: number;
  extractedLength: number;
}

export function PolicyReview() {
  const [file, setFile] = useState<File | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const acceptedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!acceptedTypes.includes(selected.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF, DOCX, or TXT file.', variant: 'destructive' });
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 10MB.', variant: 'destructive' });
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const handleReview = async () => {
    if (!file) return;
    setIsReviewing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ai/policy/review', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Review failed' }));
        throw new Error(err.error);
      }

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      toast({
        title: 'Review Failed',
        description: error.message || 'Failed to review the document.',
        variant: 'destructive',
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && acceptedTypes.includes(dropped.type)) {
      setFile(dropped);
      setResult(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          AI Policy Review
        </CardTitle>
        <CardDescription>
          Upload a policy document (PDF, DOCX) for AI-powered CQC compliance review
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File drop zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileSelect}
          />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024).toFixed(0)} KB)
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Drop a policy document here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, or TXT (max 10MB)</p>
            </>
          )}
        </div>

        {file && !result && (
          <Button onClick={handleReview} disabled={isReviewing} className="w-full">
            {isReviewing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reviewing document...
              </>
            ) : (
              'Review Policy'
            )}
          </Button>
        )}

        {/* Review results */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Review Results</h4>
              <span className="text-xs text-muted-foreground">
                {result.extractedLength.toLocaleString()} characters analysed
              </span>
            </div>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                {result.review}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
