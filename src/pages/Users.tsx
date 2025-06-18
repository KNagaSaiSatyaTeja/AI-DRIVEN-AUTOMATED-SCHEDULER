
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { AddUserModal } from '@/components/AddUserModal';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'user' | 'faculty';
}

const initialUsersData: User[] = [
  {
    id: 'admin-demo',
    name: 'Admin User',
    email: 'admin@demo.com',
    avatar: 'https://i.pravatar.cc/150?u=admin',
    role: 'admin',
  },
  {
    id: 'user-demo',
    name: 'Standard User',
    email: 'user@demo.com',
    avatar: 'https://i.pravatar.cc/150?u=user',
    role: 'user',
  },
  {
    id: '3',
    name: 'Dr. Evelyn Reed',
    email: 'e.reed@university.edu',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    role: 'faculty',
  },
  {
    id: '4',
    name: 'Prof. Samuel Tan',
    email: 's.tan@university.edu',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    role: 'faculty',
  },
];

export default function Users() {
  const { role } = useApp();
  const isAdmin = role === 'admin';
  const [users, setUsers] = useState<User[]>(initialUsersData);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const handleRoleChange = (userId: string, newRole: 'admin' | 'user' | 'faculty') => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    );

    // Update in localStorage profiles if exists
    const profiles = JSON.parse(localStorage.getItem('timetable-profiles') || '[]');
    const updatedProfiles = profiles.map((profile: any) => 
      profile.id === userId ? { ...profile, role: newRole } : profile
    );
    localStorage.setItem('timetable-profiles', JSON.stringify(updatedProfiles));

    toast({
      title: 'Role Updated',
      description: `User role has been changed to ${newRole}.`,
    });
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
          <AddUserModal isOpen={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
            <Button className="cursor-pointer">Add New User</Button>
          </AddUserModal>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
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
                {isAdmin ? (
                  <Select 
                    value={user.role} 
                    onValueChange={(newRole: 'admin' | 'user' | 'faculty') => handleRoleChange(user.id, newRole)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                )}
              </div>
              {isAdmin && (
                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" className="cursor-pointer">Edit User</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
