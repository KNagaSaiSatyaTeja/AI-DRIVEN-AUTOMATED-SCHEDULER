
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AddUserModal } from '@/components/AddUserModal';
import { EditUserModal } from '@/components/EditUserModal';
import { useState } from 'react';

const usersData = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: 'https://i.pravatar.cc/150?u=admin',
    role: 'admin',
  },
];

export default function Users() {
  const { role } = useApp();
  const isAdmin = role === 'admin';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Browse and manage system users.
          </p>
        </div>
        {isAdmin && (
          <AddUserModal isOpen={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <Button className="cursor-pointer">Add New User</Button>
          </AddUserModal>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {usersData.map((user) => (
          <Card key={user.email} className={cn(!isAdmin && "cursor-not-allowed")}>
            <CardHeader className="flex flex-row items-center space-x-4">
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Role</h4>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
              </div>
              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="cursor-pointer"
                    onClick={() => handleEditUser(user)}
                  >
                    Edit User
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedUser && (
        <EditUserModal 
          user={selectedUser}
          isOpen={isEditModalOpen} 
          onOpenChange={setIsEditModalOpen}
        />
      )}
    </div>
  );
}
