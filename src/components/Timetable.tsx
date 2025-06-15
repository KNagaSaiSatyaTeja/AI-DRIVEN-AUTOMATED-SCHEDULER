
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const scheduleData = [
    { time: '09:00 - 10:30', subject: 'Quantum Physics', faculty: 'Dr. Evelyn Reed', room: 'A-101', class: 'MSc Physics', day: 'Monday' },
    { time: '10:30 - 12:00', subject: 'Data Structures', faculty: 'Prof. Samuel Tan', room: 'B-203', class: 'B.Tech CSE', day: 'Monday' },
    { time: '01:00 - 02:30', subject: 'Organic Chemistry', faculty: 'Dr. Aisha Khan', room: 'C-305', class: 'BSc Chemistry', day: 'Monday' },
    { time: '09:00 - 10:30', subject: 'Algorithms', faculty: 'Prof. Samuel Tan', room: 'B-203', class: 'B.Tech CSE', day: 'Tuesday' },
    { time: '10:30 - 12:00', subject: 'Biochemistry', faculty: 'Dr. Aisha Khan', room: 'C-305', class: 'BSc Chemistry', day: 'Tuesday' },
    { time: '01:00 - 02:30', subject: 'Thermodynamics', faculty: 'Dr. Evelyn Reed', room: 'A-101', class: 'MSc Physics', day: 'Tuesday' },
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function Timetable() {
  const { role } = useApp();
  const isAdmin = role === 'admin';
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Timetable</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Time</TableHead>
                {days.map(day => <TableHead key={day}>{day}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {['09:00 - 10:30', '10:30 - 12:00', '12:00 - 01:00', '01:00 - 02:30', '02:30 - 04:00'].map(timeSlot => (
                <TableRow key={timeSlot}>
                  <TableCell className="font-medium text-muted-foreground">{timeSlot === '12:00 - 01:00' ? 'Lunch Break' : timeSlot}</TableCell>
                  {days.map(day => {
                    if (timeSlot === '12:00 - 01:00') {
                        return <TableCell key={day} className="bg-muted/50"></TableCell>
                    }
                    const entry = scheduleData.find(s => s.day === day && s.time === timeSlot);
                    return (
                      <TableCell key={day} className={cn(isAdmin && entry && "cursor-pointer hover:bg-accent")}>
                        {entry ? (
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold">{entry.subject}</p>
                            <p className="text-xs text-muted-foreground">{entry.faculty}</p>
                            <Badge variant="outline">{entry.room}</Badge>
                          </div>
                        ) : null}
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
