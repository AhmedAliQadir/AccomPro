import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

//todo: remove mock functionality
const tenants = [
  {
    id: "1",
    name: "Sarah Johnson",
    property: "Oakwood House",
    room: "Room 12",
    status: "active",
    supportLevel: "medium",
    moveInDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Michael Chen",
    property: "Maple Gardens",
    room: "Room 5",
    status: "active",
    supportLevel: "high",
    moveInDate: "2023-11-20",
  },
  {
    id: "3",
    name: "Emma Wilson",
    property: "Pine View",
    room: "Room 8",
    status: "notice",
    supportLevel: "low",
    moveInDate: "2024-03-01",
  },
  {
    id: "4",
    name: "James Brown",
    property: "Oakwood House",
    room: "Room 3",
    status: "active",
    supportLevel: "medium",
    moveInDate: "2023-09-10",
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    case "notice":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

const getSupportLevelColor = (level: string) => {
  switch (level) {
    case "high":
      return "bg-red-500/10 text-red-700 dark:text-red-400";
    case "medium":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    case "low":
      return "bg-green-500/10 text-green-700 dark:text-green-400";
    default:
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
  }
};

export function TenantsTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tenant</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Support Level</TableHead>
            <TableHead>Move-in Date</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.id}`}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {tenant.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{tenant.name}</span>
                </div>
              </TableCell>
              <TableCell>{tenant.property}</TableCell>
              <TableCell>{tenant.room}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getStatusColor(tenant.status)}
                >
                  {tenant.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getSupportLevelColor(tenant.supportLevel)}
                >
                  {tenant.supportLevel}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(tenant.moveInDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-actions-${tenant.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit Tenant</DropdownMenuItem>
                    <DropdownMenuItem>Add Note</DropdownMenuItem>
                    <DropdownMenuItem>View Documents</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
