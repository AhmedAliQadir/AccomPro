import { TenantsTable } from "@/components/TenantsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

export default function Tenants() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Tenants</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant information and support records
          </p>
        </div>
        <Button data-testid="button-add-tenant">
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-tenants"
          />
        </div>
      </div>

      <TenantsTable />
    </div>
  );
}
