
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoomScheduleProps {
  roomId: string;
}

export function RoomSchedule({ roomId }: RoomScheduleProps) {
  const { schedule } = useApp();
  const roomSchedule = schedule.filter(entry => entry.room === roomId);
  const subjects = [...new Set(roomSchedule.map(e => e.subject).filter(s => s && s !== 'Break'))];
  const faculty = [...new Set(roomSchedule.map(e => e.faculty).filter(f => f))];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Room: {roomId}</CardTitle>
        <Button asChild variant="outline" size="sm">
          <Link to={`/rooms/${roomId}`}>
            View & Manage
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            {subjects.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Subjects</h4>
                    <div className="flex flex-wrap gap-2">
                        {subjects.map((s, index) => <Badge key={`subject-${index}`} variant="secondary">{s}</Badge>)}
                    </div>
                </div>
            )}
            {faculty.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Faculty</h4>
                    <div className="flex flex-wrap gap-2">
                        {faculty.map((f, index) => <Badge key={`faculty-${index}`} variant="outline">{f}</Badge>)}
                    </div>
                </div>
            )}
             {(subjects.length === 0 && faculty.length === 0) && (
                <p className="text-muted-foreground text-sm">No schedule information available for this room.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
