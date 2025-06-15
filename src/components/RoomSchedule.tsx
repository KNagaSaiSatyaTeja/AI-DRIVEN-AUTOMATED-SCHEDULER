
import { scheduleData, days, timeSlots } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RoomScheduleProps {
  roomId: string;
}

export function RoomSchedule({ roomId }: RoomScheduleProps) {
  const { role } = useApp();
  const isAdmin = role === 'admin';
  const roomSchedule = scheduleData.filter(entry => entry.room === roomId);
  const subjects = [...new Set(roomSchedule.map(e => e.subject).filter(s => s && s !== 'Break'))];
  const faculty = [...new Set(roomSchedule.map(e => e.faculty).filter(f => f))];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Room: {roomId}</CardTitle>
        {isAdmin && (
          <Button asChild variant="outline" size="sm">
            <Link to={`/rooms/${roomId}`}>
              Manage Schedule
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {(subjects.length > 0 || faculty.length > 0) && (
            <div className="mb-4 flex flex-wrap gap-x-6 gap-y-4 text-sm border-b pb-4">
                {subjects.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 text-muted-foreground">Subjects</h4>
                        <div className="flex flex-wrap gap-2">
                            {subjects.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                        </div>
                    </div>
                )}
                {faculty.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 text-muted-foreground">Faculty</h4>
                        <div className="flex flex-wrap gap-2">
                            {faculty.map(f => <Badge key={f} variant="outline">{f}</Badge>)}
                        </div>
                    </div>
                )}
            </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Time</TableHead>
                {days.map(day => <TableHead key={day}>{day}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map(timeSlot => (
                <TableRow key={timeSlot}>
                  <TableCell className="font-medium text-muted-foreground">{timeSlot}</TableCell>
                  {days.map(day => {
                    const entry = roomSchedule.find(s => s.day === day && s.time === timeSlot);
                    const isBreak = entry?.subject === 'Break';

                    if (isBreak) {
                        return <TableCell key={day} className="bg-muted/50 text-center text-xs italic">Break</TableCell>
                    }
                    
                    return (
                      <TableCell key={day}>
                        {entry ? (
                          <div className="flex flex-col gap-1 text-sm">
                            <p className="font-semibold">{entry.subject}</p>
                            <p className="text-xs text-muted-foreground">{entry.faculty}</p>
                            <p className="text-xs text-muted-foreground">{entry.class}</p>
                          </div>
                        ) : <div className="h-full w-full"></div>}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
