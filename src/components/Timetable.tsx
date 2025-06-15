
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { days } from '@/data/schedule';

export function Timetable() {
  const { role, schedule, timeSlots } = useApp();
  const isAdmin = role === 'admin';
  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Timetable Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Day</TableHead>
                {timeSlots.map(timeSlot => <TableHead key={timeSlot}>{timeSlot}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map(day => (
                <TableRow key={day}>
                  <TableCell className="font-medium text-muted-foreground">{day}</TableCell>
                  {timeSlots.map(timeSlot => {
                    const entries = schedule.filter(s => s.day === day && s.time === timeSlot);
                    
                    if (entries.length === 0) {
                        return <TableCell key={timeSlot}></TableCell>
                    }

                    if (entries.length > 1) {
                        return <TableCell key={timeSlot}><Badge variant="destructive">Clash</Badge></TableCell>
                    }

                    const entry = entries[0];
                    const isBreak = entry.subject === 'Break';

                    if (isBreak) {
                        return <TableCell key={timeSlot} className="bg-muted/50 text-center text-xs italic">Break in {entry.room}</TableCell>
                    }
                    
                    return (
                      <TableCell key={timeSlot} className={cn(isAdmin && entry && "cursor-pointer hover:bg-accent")}>
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
