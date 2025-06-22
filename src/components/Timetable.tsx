
// import { useApp } from '@/context/AppContext';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
// import { cn } from '@/lib/utils';
// import { days } from '@/data/schedule';

// export function Timetable() {
//   const { role, schedule, timeSlots, timetables } = useApp();
//   const isAdmin = role === 'admin';
  
//   // Get breaks from timetables data
//   const allBreaks = timetables.flatMap(t => t.breaks || []);
  
//   // Helper function to check if a time slot is a break
//   const isBreakTime = (day: string, timeSlot: string) => {
//     const [startTime, endTime] = timeSlot.split(' - ');
//     return allBreaks.some(breakItem => {
//       const breakDay = breakItem.day === 'ALL_DAYS' ? day.toUpperCase() : breakItem.day;
//       return (breakDay === day.toUpperCase() || breakItem.day === 'ALL_DAYS') &&
//              breakItem.startTime <= startTime && breakItem.endTime >= endTime;
//     });
//   };
  
//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Weekly Timetable Overview</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <div className="overflow-x-auto">
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead className="w-[120px]">Day</TableHead>
//                 {timeSlots.map(timeSlot => <TableHead key={timeSlot}>{timeSlot}</TableHead>)}
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {days.map(day => (
//                 <TableRow key={day}>
//                   <TableCell className="font-medium text-muted-foreground">{day}</TableCell>
//                   {timeSlots.map(timeSlot => {
//                     const entries = schedule.filter(s => s.day === day && s.time === timeSlot);
//                     const isBreak = isBreakTime(day, timeSlot);
                    
//                     if (isBreak) {
//                       return (
//                         <TableCell key={timeSlot} className="bg-muted/50 text-center">
//                           <div className="flex flex-col gap-1">
//                             <p className="text-sm font-medium text-muted-foreground">Break</p>
//                             <Badge variant="outline" className="text-xs">Break Time</Badge>
//                           </div>
//                         </TableCell>
//                       );
//                     }
                    
//                     if (entries.length === 0) {
//                         return <TableCell key={timeSlot}></TableCell>
//                     }

//                     if (entries.length > 1) {
//                         return <TableCell key={timeSlot}><Badge variant="destructive">Clash</Badge></TableCell>
//                     }

//                     const entry = entries[0];
                    
//                     return (
//                       <TableCell key={timeSlot} className={cn(isAdmin && entry && "cursor-pointer hover:bg-accent")}>
//                         {entry ? (
//                           <div className="flex flex-col gap-1">
//                             <p className="font-semibold">{entry.subject}</p>
//                             <p className="text-xs text-muted-foreground">{entry.faculty}</p>
//                             <Badge variant="outline">{entry.room}</Badge>
//                           </div>
//                         ) : null}
//                       </TableCell>
//                     );
//                   })}
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { days } from "@/data/schedule";
import { useEffect } from "react";

export function Timetable() {
  const { role, schedule, timeSlots, timetables, selectedRoom, getTimetables } =
    useApp();
  const isAdmin = role === "admin";

  useEffect(() => {
    if (selectedRoom) {
      getTimetables(selectedRoom);
    }
  }, [selectedRoom, getTimetables]);

  // Get breaks from timetables data for the selected room
  const allBreaks = timetables
    .flatMap((t) => t.breaks || [])
    .filter(
      (b) =>
        b.day === "ALL_DAYS" ||
        b.day === days.map((d) => d.toUpperCase()).find((d) => d === b.day)
    );

  // Helper function to check if a time slot is a break
  const isBreakTime = (day: string, timeSlot: string) => {
    const [startTime, endTime] = timeSlot.split(" - ");
    return allBreaks.some((breakItem) => {
      const breakDay =
        breakItem.day === "ALL_DAYS" ? day.toUpperCase() : breakItem.day;
      return (
        (breakDay === day.toUpperCase() || breakItem.day === "ALL_DAYS") &&
        breakItem.startTime <= startTime &&
        breakItem.endTime >= endTime
      );
    });
  };

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
                {timeSlots.map((timeSlot) => (
                  <TableHead key={timeSlot}>{timeSlot}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((day) => (
                <TableRow key={day}>
                  <TableCell className="font-medium text-muted-foreground">
                    {day}
                  </TableCell>
                  {timeSlots.map((timeSlot) => {
                    const entries = schedule.filter(
                      (s) =>
                        s.day === day &&
                        s.time === timeSlot &&
                        s.room === (selectedRoom || "")
                    );
                    const isBreak = isBreakTime(day, timeSlot);

                    if (isBreak) {
                      return (
                        <TableCell
                          key={timeSlot}
                          className="bg-muted/50 text-center"
                        >
                          <div className="flex flex-col gap-1">
                            <p className="text-sm font-medium text-muted-foreground">
                              Break
                            </p>
                            <Badge variant="outline" className="text-xs">
                              Break Time
                            </Badge>
                          </div>
                        </TableCell>
                      );
                    }

                    if (entries.length === 0) {
                      return <TableCell key={timeSlot}></TableCell>;
                    }

                    if (entries.length > 1) {
                      return (
                        <TableCell key={timeSlot}>
                          <Badge variant="destructive">Clash</Badge>
                        </TableCell>
                      );
                    }

                    const entry = entries[0];

                    return (
                      <TableCell
                        key={timeSlot}
                        className={cn(
                          isAdmin && entry && "cursor-pointer hover:bg-accent"
                        )}
                      >
                        {entry ? (
                          <div className="flex flex-col gap-1">
                            <p className="font-semibold">{entry.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              {entry.faculty}
                            </p>
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