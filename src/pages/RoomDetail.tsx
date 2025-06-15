
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { days, timeSlots, ScheduleEntry } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Edit } from 'lucide-react';
import { EditScheduleModal } from '@/components/EditScheduleModal';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const { role, schedule } = useApp();
  const isAdmin = role === 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

  const roomSchedule = schedule.filter(entry => entry.room === roomId);
  const roomExists = schedule.some(entry => entry.room === roomId);
  const subjects = [...new Set(roomSchedule.map(e => e.subject).filter(s => s && s !== 'Break'))];
  const faculty = [...new Set(roomSchedule.map(e => e.faculty).filter(f => f))];
  const breaks = roomSchedule.filter(e => e.subject === 'Break');

  if (!roomExists) {
    return (
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold">Room Not Found</h1>
        <p className="text-muted-foreground">The room "{roomId}" does not exist.</p>
        <Button asChild variant="link" className="mt-4">
          <Link to="/rooms">
            Back to All Rooms
          </Link>
        </Button>
      </div>
    );
  }

  const handleEditClick = (entry: ScheduleEntry) => {
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };
  
  const handleAddClick = (day: string, time: string) => {
    const newEntry: ScheduleEntry = {
        day,
        time,
        room: roomId || '',
        subject: '',
        faculty: '',
        class: ''
    };
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <Button asChild variant="outline" size="sm" className="mb-4">
                <Link to="/rooms">
                    Back to All Rooms
                </Link>
            </Button>
            <h1 className="text-2xl font-bold">Room: {roomId}</h1>
        </div>
      </div>
      
      <Tabs defaultValue="timetable" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            <TabsTrigger value="breaks">Breaks</TabsTrigger>
            <TabsTrigger value="timings">Timings</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>
        <TabsContent value="subjects" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Subjects Taught in Room {roomId}</CardTitle>
                </CardHeader>
                <CardContent>
                    {subjects.length > 0 ? (
                        <ul className="list-disc space-y-2 pl-5">
                            {subjects.map(s => <li key={s}>{s}</li>)}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No subjects are taught in this room.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="faculty" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Faculty Associated with Room {roomId}</CardTitle>
                </CardHeader>
                <CardContent>
                    {faculty.length > 0 ? (
                        <ul className="list-disc space-y-2 pl-5">
                            {faculty.map(f => <li key={f}>{f}</li>)}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No faculty are associated with this room.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="breaks" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Scheduled Breaks in Room {roomId}</CardTitle>
                </CardHeader>
                <CardContent>
                    {breaks.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Time</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {breaks.map((b, i) => (
                                    <TableRow key={`${b.day}-${b.time}-${i}`}>
                                        <TableCell>{b.day}</TableCell>
                                        <TableCell>{b.time}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-muted-foreground">No breaks are scheduled in this room.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="timings" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>College Timings</CardTitle>
                    <CardDescription>Available time slots for scheduling classes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {timeSlots.map(slot => <Badge variant="secondary" key={slot}>{slot}</Badge>)}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="timetable" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>Weekly Schedule</CardTitle>
                    <CardDescription>
                        Admins can click on a slot to add or edit an entry.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
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
                                return (
                                    <TableCell key={day} className={cn('relative h-24 bg-muted/50', isAdmin ? "cursor-pointer hover:bg-accent" : "")} onClick={() => isAdmin && entry && handleEditClick(entry)}>
                                        <div className="flex items-center justify-center h-full text-sm font-medium text-muted-foreground">
                                            Break
                                        </div>
                                        {isAdmin && <div className="absolute top-1 right-1 p-1 rounded-full hover:bg-background"><Edit className="h-3 w-3 text-muted-foreground"/></div>}
                                    </TableCell>
                                )
                              }
                              
                              return (
                                <TableCell key={day} className={cn('relative h-24', isAdmin ? "cursor-pointer hover:bg-accent" : "")} onClick={() => isAdmin && (entry ? handleEditClick(entry) : handleAddClick(day, timeSlot))}>
                                  {entry ? (
                                    <div className="flex flex-col gap-1 text-sm">
                                      <p className="font-semibold">{entry.subject}</p>
                                      <p className="text-xs text-muted-foreground">{entry.faculty}</p>
                                      <p className="text-xs text-muted-foreground">{entry.class}</p>
                                       {isAdmin && <div className="absolute top-1 right-1 p-1 rounded-full hover:bg-background"><Edit className="h-3 w-3 text-muted-foreground"/></div>}
                                    </div>
                                  ) : (isAdmin && 
                                    <div className="flex items-center justify-center h-full text-muted-foreground/50">
                                        <Edit className="h-4 w-4"/>
                                    </div>
                                  )}
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
        </TabsContent>
      </Tabs>

      {selectedEntry && (
        <EditScheduleModal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          scheduleEntry={selectedEntry}
        />
      )}
    </div>
  );
}
