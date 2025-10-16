import { PropertyCard } from "../PropertyCard";

export default function PropertyCardExample() {
  const property = {
    id: "1",
    name: "Oakwood House",
    address: "123 Oak Street, Manchester, M1 2AB",
    totalUnits: 12,
    occupiedUnits: 11,
    activeIssues: 2,
    complianceStatus: "current" as const,
  };

  return (
    <div className="max-w-sm">
      <PropertyCard property={property} />
    </div>
  );
}
