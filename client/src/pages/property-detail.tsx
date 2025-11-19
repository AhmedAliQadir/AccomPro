import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, MapPin, Home, Users, Bed } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROOM_TYPES, ROOM_TYPE_CONFIG, ROOM_FACILITIES, ROOM_FACILITY_LABELS, type RoomType, type RoomFacility } from '@shared/schema';

interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  floor?: number;
  facilities?: string[];
  _count: {
    tenancies: number;
  };
}

interface Property {
  id: string;
  name: string;
  address: string;
  postcode: string;
  totalUnits: number;
  description?: string;
  rooms: Room[];
  assignments: Array<{
    id: string;
    startDate: string;
    endDate: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
  }>;
}

function CreateRoomDialog({ propertyId }: { propertyId: string }) {
  const [open, setOpen] = useState(false);
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState<RoomType>('single');
  const [floor, setFloor] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<RoomFacility[]>([]);
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/properties/${propertyId}/rooms`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties', propertyId] });
      setOpen(false);
      setRoomNumber('');
      setRoomType('single');
      setFloor('');
      setSelectedFacilities([]);
      toast({
        title: 'Room created',
        description: 'The room has been created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create room',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFacilityToggle = (facility: RoomFacility) => {
    setSelectedFacilities(prev =>
      prev.includes(facility)
        ? prev.filter(f => f !== facility)
        : [...prev, facility]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      propertyId,
      roomNumber,
      capacity: ROOM_TYPE_CONFIG[roomType].capacity,
      floor: floor ? parseInt(floor, 10) : undefined,
      facilities: selectedFacilities,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-create-room">
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
          <DialogDescription>
            Add a new room to this property
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room Number</Label>
            <Input
              id="roomNumber"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              required
              data-testid="input-room-number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={roomType} onValueChange={(value) => setRoomType(value as RoomType)}>
              <SelectTrigger id="roomType" data-testid="select-room-type">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                {ROOM_TYPES.map((type) => (
                  <SelectItem key={type} value={type} data-testid={`option-room-type-${type}`}>
                    {ROOM_TYPE_CONFIG[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="floor">Floor (Optional)</Label>
            <Input
              id="floor"
              type="number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              data-testid="input-room-floor"
            />
          </div>
          <div className="space-y-3">
            <Label>Facilities</Label>
            <div className="space-y-2">
              {ROOM_FACILITIES.map((facility) => (
                <div key={facility} className="flex items-center space-x-2">
                  <Checkbox
                    id={`facility-${facility}`}
                    checked={selectedFacilities.includes(facility)}
                    onCheckedChange={() => handleFacilityToggle(facility)}
                    data-testid={`checkbox-facility-${facility}`}
                  />
                  <Label
                    htmlFor={`facility-${facility}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {ROOM_FACILITY_LABELS[facility]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-room">
              {createMutation.isPending ? 'Creating...' : 'Create Room'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PropertyDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/properties/:id');
  const propertyId = params?.id;
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ property: Property }>({
    queryKey: ['/api/properties', propertyId],
    enabled: !!propertyId,
  });

  const property = data?.property;
  const canManage = user?.role === 'ADMIN' || user?.role === 'OPS';

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-6" />
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-24 w-full bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Property not found</h2>
          <Button onClick={() => setLocation('/properties')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  const occupiedRooms = property.rooms.filter((r) => r._count.tenancies > 0).length;
  const occupancyRate = property.rooms.length > 0 
    ? Math.round((occupiedRooms / property.rooms.length) * 100) 
    : 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <Button variant="ghost" onClick={() => setLocation('/properties')} className="mb-4" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Properties
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{property.name}</h1>
            <p className="text-muted-foreground flex items-start gap-1 mt-1">
              <MapPin className="h-4 w-4 mt-0.5" />
              {property.address}, {property.postcode}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-rooms">
              {property.rooms.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-occupancy-rate">
              {occupancyRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {occupiedRooms} / {property.rooms.length} occupied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-units">
              {property.totalUnits}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Rooms</h2>
            {canManage && <CreateRoomDialog propertyId={property.id} />}
          </div>

          {property.rooms.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Home className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No rooms yet</p>
                <p className="text-sm text-muted-foreground">
                  Add rooms to this property
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {property.rooms.map((room) => {
                const roomTypeEntry = Object.entries(ROOM_TYPE_CONFIG).find(
                  ([, config]) => config.capacity === room.capacity
                );
                const roomTypeLabel = roomTypeEntry ? roomTypeEntry[1].label : `${room.capacity} Person`;

                return (
                  <Card key={room.id} data-testid={`card-room-${room.id}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bed className="h-5 w-5 text-primary" />
                        Room {room.roomNumber}
                      </CardTitle>
                      {room.floor !== undefined && room.floor !== null && (
                        <CardDescription>Floor {room.floor}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Type</span>
                          <Badge variant="secondary" data-testid={`badge-room-type-${room.id}`}>
                            {roomTypeLabel}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Occupied</span>
                          <Badge variant={room._count.tenancies > 0 ? 'default' : 'outline'}>
                            {room._count.tenancies} / {room.capacity}
                          </Badge>
                        </div>
                        {room.facilities && room.facilities.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-sm text-muted-foreground">Facilities</span>
                            <div className="flex flex-wrap gap-1">
                              {room.facilities.map((facility) => (
                                <Badge 
                                  key={facility} 
                                  variant="outline"
                                  className="text-xs"
                                  data-testid={`badge-facility-${facility}-${room.id}`}
                                >
                                  {ROOM_FACILITY_LABELS[facility as RoomFacility] || facility}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <h2 className="text-xl font-semibold">Staff Assignments</h2>

          {property.assignments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No assignments yet</p>
                <p className="text-sm text-muted-foreground">
                  No staff members are assigned to this property
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {(() => {
                const opsStaff = property.assignments.filter(a => a.user.role === 'OPS');
                const supportStaff = property.assignments.filter(a => a.user.role === 'SUPPORT');
                
                return (
                  <>
                    {opsStaff.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Operations Managers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {opsStaff.map((assignment) => (
                            <Card key={assignment.id} data-testid={`card-assignment-ops-${assignment.user.id}`}>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Users className="h-5 w-5 text-primary" />
                                  {assignment.user.firstName} {assignment.user.lastName}
                                </CardTitle>
                                <CardDescription>{assignment.user.email}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">OPS</Badge>
                                    <Badge variant="secondary">Active</Badge>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Assigned: </span>
                                    {new Date(assignment.startDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {supportStaff.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium mb-3">Support Workers</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {supportStaff.map((assignment) => (
                            <Card key={assignment.id} data-testid={`card-assignment-support-${assignment.user.id}`}>
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <Users className="h-5 w-5 text-primary" />
                                  {assignment.user.firstName} {assignment.user.lastName}
                                </CardTitle>
                                <CardDescription>{assignment.user.email}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">SUPPORT</Badge>
                                    <Badge variant="secondary">Active</Badge>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Assigned: </span>
                                    {new Date(assignment.startDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
