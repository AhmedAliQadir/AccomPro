import { CaseCard } from "../CaseCard";

export default function CaseCardExample() {
  const caseItem = {
    id: "1",
    type: "safeguarding" as const,
    title: "Welfare check required",
    tenant: "Sarah Johnson",
    severity: "high" as const,
    status: "in-progress" as const,
    createdDate: "2024-10-15",
    dueDate: "2024-10-18",
  };

  return (
    <div className="max-w-sm">
      <CaseCard caseItem={caseItem} />
    </div>
  );
}
