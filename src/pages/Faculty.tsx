
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const facultyData = [
  {
    name: 'Dr. Evelyn Reed',
    email: 'e.reed@university.edu',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
    subjects: ['Quantum Physics', 'Thermodynamics'],
    availability: 'Mon, Wed, Fri (9am - 5pm)',
  },
  {
    name: 'Prof. Samuel Tan',
    email: 's.tan@university.edu',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026705d',
    subjects: ['Data Structures', 'Algorithms'],
    availability: 'Tue, Thu (10am - 4pm)',
  },
  {
    name: 'Dr. Aisha Khan',
    email: 'a.khan@university.edu',
    avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026706d',
    subjects: ['Organic Chemistry', 'Biochemistry'],
    availability: 'Mon, Tue, Thu (11am - 3pm)',
  },
];

export default function Faculty() {
  const { role } = useApp();
  const isAdmin = role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faculty Members</h1>
          <p className="text-muted-foreground">
            Browse and manage faculty details.
          </p>
        </div>
        {isAdmin && (
          <Button className="cursor-pointer">Add New Faculty</Button>
        )}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {facultyData.map((faculty) => (
          <Card key={faculty.name} className={cn(!isAdmin && "cursor-not-allowed")}>
            <CardHeader className="flex flex-row items-center space-x-4">
              <Avatar>
                <AvatarImage src={faculty.avatar} />
                <AvatarFallback>{faculty.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>{faculty.name}</CardTitle>
                <CardDescription>{faculty.email}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Subjects</h4>
                <div className="flex flex-wrap gap-2">
                  {faculty.subjects.map((subject) => (
                    <Badge key={subject} variant="secondary">{subject}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Availability</h4>
                <p className="text-sm text-muted-foreground">{faculty.availability}</p>
              </div>
              {isAdmin && (
                <div className="flex justify-end pt-2">
                    <Button variant="outline" size="sm" className="cursor-pointer">Edit Details</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
