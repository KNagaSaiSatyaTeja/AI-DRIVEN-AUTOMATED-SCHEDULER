
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { scheduleData, days, timeSlots } from '@/data/schedule';

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
              {timeSlots.map(timeSlot => (
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
