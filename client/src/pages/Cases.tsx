import { CaseCard } from "@/components/CaseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState } from "react";

//todo: remove mock functionality
const cases = [
  {
    id: "1",
    type: "safeguarding" as const,
    title: "Welfare check required",
    tenant: "Sarah Johnson",
    severity: "high" as const,
    status: "in-progress" as const,
    createdDate: "2024-10-15",
    dueDate: "2024-10-18",
  },
  {
    id: "2",
    type: "complaint" as const,
    title: "Noise complaint",
    tenant: "Michael Chen",
    severity: "medium" as const,
    status: "open" as const,
    createdDate: "2024-10-16",
  },
  {
    id: "3",
    type: "asb" as const,
    title: "Anti-social behaviour report",
    tenant: "James Brown",
    severity: "high" as const,
    status: "in-progress" as const,
    createdDate: "2024-10-14",
    dueDate: "2024-10-19",
  },
  {
    id: "4",
    type: "complaint" as const,
    title: "Maintenance delay",
    tenant: "Emma Wilson",
    severity: "low" as const,
    status: "resolved" as const,
    createdDate: "2024-10-10",
  },
];

export default function Cases() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Case Management</h1>
          <p className="text-muted-foreground mt-1">
            Track complaints, safeguarding, and ASB cases
          </p>
        </div>
        <Button data-testid="button-add-case">
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-cases"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]" data-testid="select-case-type">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="safeguarding">Safeguarding</SelectItem>
            <SelectItem value="complaint">Complaint</SelectItem>
            <SelectItem value="asb">ASB</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cases.map((caseItem) => (
          <CaseCard key={caseItem.id} caseItem={caseItem} />
        ))}
      </div>
    </div>
  );
}
