import { PropertyCard } from "@/components/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const properties = [
  {
    id: "1",
    name: "Oakwood House",
    address: "123 Oak Street, Manchester, M1 2AB",
    totalUnits: 12,
    occupiedUnits: 11,
    activeIssues: 2,
    complianceStatus: "current" as const,
  },
  {
    id: "2",
    name: "Maple Gardens",
    address: "45 Maple Avenue, Manchester, M2 3CD",
    totalUnits: 8,
    occupiedUnits: 8,
    activeIssues: 0,
    complianceStatus: "current" as const,
  },
  {
    id: "3",
    name: "Pine View",
    address: "78 Pine Road, Manchester, M3 4EF",
    totalUnits: 15,
    occupiedUnits: 13,
    activeIssues: 1,
    complianceStatus: "expiring" as const,
  },
  {
    id: "4",
    name: "Cedar Court",
    address: "90 Cedar Lane, Manchester, M4 5GH",
    totalUnits: 10,
    occupiedUnits: 9,
    activeIssues: 3,
    complianceStatus: "expired" as const,
  },
];

export default function Properties() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Properties</h1>
          <p className="text-muted-foreground mt-1">
            Manage properties and compliance
          </p>
        </div>
        <Button data-testid="button-add-property">
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-properties"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
