import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X, UserPlus } from 'lucide-react';
import { useState } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface StaffPickerProps {
  role: 'OPS' | 'SUPPORT';
  organizationId: string;
  selectedUserIds: string[];
  onSelectionChange: (userIds: string[]) => void;
  label: string;
  placeholder?: string;
}

export function StaffPicker({ role, organizationId, selectedUserIds, onSelectionChange, label, placeholder }: StaffPickerProps) {
  const [open, setOpen] = useState(false);

  const queryUrl = `/api/users?role=${role}&organizationId=${organizationId}`;
  
  const { data, isLoading } = useQuery<{ users: User[] }>({
    queryKey: [queryUrl],
  });

  const users = data?.users || [];
  const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));
  const availableUsers = users.filter(u => !selectedUserIds.includes(u.id));

  const handleSelect = (userId: string) => {
    if (!selectedUserIds.includes(userId)) {
      onSelectionChange([...selectedUserIds, userId]);
    }
    setOpen(false);
  };

  const handleRemove = (userId: string) => {
    onSelectionChange(selectedUserIds.filter(id => id !== userId));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedUsers.map(user => (
          <Badge
            key={user.id}
            variant="secondary"
            className="gap-1"
            data-testid={`badge-selected-${role.toLowerCase()}-${user.id}`}
          >
            {user.firstName} {user.lastName}
            <button
              type="button"
              onClick={() => handleRemove(user.id)}
              className="ml-1 hover:bg-muted rounded-full"
              data-testid={`button-remove-${role.toLowerCase()}-${user.id}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isLoading}
            data-testid={`button-add-${role.toLowerCase()}`}
          >
            <UserPlus className="h-4 w-4" />
            {placeholder || `Add ${role === 'OPS' ? 'Operations Manager' : 'Support Worker'}`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <Command>
            <CommandInput placeholder={`Search ${role === 'OPS' ? 'operations managers' : 'support workers'}...`} />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Loading...' : `No ${role === 'OPS' ? 'operations managers' : 'support workers'} found`}
              </CommandEmpty>
              <CommandGroup>
                {availableUsers.map(user => (
                  <CommandItem
                    key={user.id}
                    value={`${user.firstName} ${user.lastName} ${user.email}`}
                    onSelect={() => handleSelect(user.id)}
                    data-testid={`option-${role.toLowerCase()}-${user.id}`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
