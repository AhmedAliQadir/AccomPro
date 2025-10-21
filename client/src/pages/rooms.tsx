import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bed, Building2, MapPin, Users } from 'lucide-react';

interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  floor: number;
  property: {
    id: string;
    name: string;
    address: string;
  };
  _count: {
    tenancies: number;
  };
}

export default function RoomsPage() {
  const [, setLocation] = useLocation();
  const { data, isLoading } = useQuery<{ rooms: Room[] }>({
    queryKey: ['/api/rooms'],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const rooms = data?.rooms || [];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">All Rooms</h1>
          <p className="text-muted-foreground mt-1">
            View all rooms across all properties
          </p>
        </div>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bed className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No rooms yet</p>
            <p className="text-sm text-muted-foreground">
              Rooms will appear here once you add them to properties
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card
              key={room.id}
              className="hover-elevate active-elevate-2 h-full cursor-pointer"
              onClick={() => setLocation(`/properties/${room.property.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-primary" />
                    Room {room.roomNumber}
                  </div>
                  <Badge variant={room._count.tenancies < room.capacity ? 'default' : 'secondary'}>
                    {room._count.tenancies < room.capacity ? 'Available' : 'Full'}
                  </Badge>
                </CardTitle>
                <CardDescription className="flex items-start gap-1">
                  <Building2 className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-1">{room.property.name}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{room.property.address}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Floor {room.floor}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{room._count.tenancies} / {room.capacity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
