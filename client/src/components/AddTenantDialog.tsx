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
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AddTenantDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [property, setProperty] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding tenant:", { name, property });
    toast({
      title: "Tenant Added",
      description: `${name} has been added successfully.`,
    });
    setOpen(false);
    setName("");
    setProperty("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-add-tenant">
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tenant</DialogTitle>
          <DialogDescription>
            Enter the tenant's details to create a new record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenant-name">Full Name</Label>
            <Input
              id="tenant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tenant name"
              data-testid="input-tenant-name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenant-property">Property</Label>
            <Select value={property} onValueChange={setProperty} required>
              <SelectTrigger id="tenant-property" data-testid="select-tenant-property">
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oakwood">Oakwood House</SelectItem>
                <SelectItem value="maple">Maple Gardens</SelectItem>
                <SelectItem value="pine">Pine View</SelectItem>
                <SelectItem value="cedar">Cedar Court</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              data-testid="button-cancel-tenant"
            >
              Cancel
            </Button>
            <Button type="submit" data-testid="button-submit-tenant">
              Add Tenant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
