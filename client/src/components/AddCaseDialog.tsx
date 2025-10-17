import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AddCaseDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creating case:", { title, type, severity });
    toast({
      title: "Case Created",
      description: `New ${type} case has been created.`,
    });
    setOpen(false);
    setTitle("");
    setType("");
    setSeverity("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-case">
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
          <DialogDescription>
            Log a new complaint, safeguarding, or ASB case.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="case-title">Case Title</Label>
            <Input
              id="case-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description"
              data-testid="input-case-title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="case-type">Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger id="case-type" data-testid="select-case-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safeguarding">Safeguarding</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="asb">ASB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="case-severity">Severity</Label>
            <Select value={severity} onValueChange={setSeverity} required>
              <SelectTrigger id="case-severity" data-testid="select-case-severity">
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-case"
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-case">
              Create Case
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
