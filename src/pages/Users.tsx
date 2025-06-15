
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const usersData = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: 'https://i.pravatar.cc/150?u=admin',
    role: 'admin',
  },
  {
    name: 'Standard User',
    email: 'user@example.com',
    avatar: 'https://i.pravatar.cc/150?u=user',
    role: 'user',
  },
  {
    name: 'Dr. Evelyn Reed',
    email: 'e.reed@university.edu',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    role: 'faculty',
  },
  {
    name: 'Prof. Samuel Tan',
    email: 's.tan@university.edu',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    role: 'faculty',
  },
];

export default function Users() {
  const { role } = useApp();
  const isAdmin = role === 'admin';

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
          <Button className="cursor-pointer">Add New User</Button>
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
