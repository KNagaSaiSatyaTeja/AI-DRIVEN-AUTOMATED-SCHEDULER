
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { days, ScheduleEntry } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Edit, Trash2, Plus } from 'lucide-react';
import { EditScheduleModal } from '@/components/EditScheduleModal';
import { EditTimeSlotModal } from '@/components/EditTimeSlotModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";


export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const { role, schedule, timeSlots, deleteTimeSlot } = useApp();
  const isAdmin = role === 'admin';
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

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
  
  const handleAddFromTimetable = (day: string, time: string) => {
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

  const handleAddNew = (type: 'session' | 'break') => {
    const newEntry: ScheduleEntry = {
        day: '',
        time: '',
        room: roomId || '',
        subject: type === 'break' ? 'Break' : '',
        faculty: '',
        class: '',
    };
    setSelectedEntry(newEntry);
    setIsModalOpen(true);
  };

  const handleEditTimeSlotClick = (slot: string) => {
    setSelectedTimeSlot(slot);
    setIsTimingModalOpen(true);
  };
  
  const handleAddTimeSlotClick = () => {
    setSelectedTimeSlot(null);
    setIsTimingModalOpen(true);
  };
  
  const handleDeleteTimeSlot = (slot: string) => {
    if (window.confirm(`Are you sure you want to delete the time slot "${slot}"? This will also remove all scheduled classes in this slot.`)) {
      deleteTimeSlot(slot);
      toast({
        title: "Time Slot Deleted",
        description: `The time slot ${slot} and all associated classes have been removed.`,
        variant: "destructive",
      });
    }
  };


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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Subjects Taught in Room {roomId}</CardTitle>
                        <CardDescription>Click edit to modify a specific class session.</CardDescription>
                    </div>
                    {isAdmin && (
                        <Button size="sm" onClick={() => handleAddNew('session')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Session
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {subjects.length > 0 ? (
                        <div className="space-y-6">
                            {subjects.map(subject => (
                              <div key={subject}>
                                <h4 className="font-semibold mb-2 border-b pb-2">{subject}</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Day</TableHead>
                                      <TableHead>Time</TableHead>
                                      <TableHead>Faculty</TableHead>
                                      <TableHead>Class</TableHead>
                                      {isAdmin && <TableHead className="w-10"></TableHead>}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {roomSchedule.filter(e => e.subject === subject).map(entry => (
                                      <TableRow key={`${entry.day}-${entry.time}-${entry.faculty}`}>
                                        <TableCell>{entry.day}</TableCell>
                                        <TableCell>{entry.time}</TableCell>
                                        <TableCell>{entry.faculty}</TableCell>
                                        <TableCell>{entry.class}</TableCell>
                                        {isAdmin && (
                                          <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(entry)}>
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No subjects are taught in this room.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="faculty" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Faculty in Room {roomId}</CardTitle>
                        <CardDescription>Click edit to modify a specific class session.</CardDescription>
                    </div>
                    {isAdmin && (
                        <Button size="sm" onClick={() => handleAddNew('session')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Session
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {faculty.length > 0 ? (
                        <div className="space-y-6">
                            {faculty.map(f => (
                              <div key={f}>
                                <h4 className="font-semibold mb-2 border-b pb-2">{f}</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Day</TableHead>
                                      <TableHead>Time</TableHead>
                                      <TableHead>Subject</TableHead>
                                      <TableHead>Class</TableHead>
                                      {isAdmin && <TableHead className="w-10"></TableHead>}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {roomSchedule.filter(e => e.faculty === f).map(entry => (
                                      <TableRow key={`${entry.day}-${entry.time}-${entry.subject}`}>
                                        <TableCell>{entry.day}</TableCell>
                                        <TableCell>{entry.time}</TableCell>
                                        <TableCell>{entry.subject}</TableCell>
                                        <TableCell>{entry.class}</TableCell>
                                        {isAdmin && (
                                          <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(entry)}>
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">No faculty are associated with this room.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="breaks" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Scheduled Breaks in Room {roomId}</CardTitle>
                        <CardDescription>Click edit to modify or delete a break.</CardDescription>
                    </div>
                    {isAdmin && (
                        <Button size="sm" onClick={() => handleAddNew('break')}>
                            <Plus className="mr-2 h-4 w-4" /> Add Break
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {breaks.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Day</TableHead>
                                    <TableHead>Time</TableHead>
                                    {isAdmin && <TableHead className="w-[100px] text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {breaks.map((b, i) => (
                                    <TableRow key={`${b.day}-${b.time}-${i}`}>
                                        <TableCell>{b.day}</TableCell>
                                        <TableCell>{b.time}</TableCell>
                                        {isAdmin && (
                                          <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(b)}>
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TableCell>
                                        )}
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
                <CardHeader className="flex-row items-center justify-between">
                  <div>
                    <CardTitle>College Timings</CardTitle>
                    <CardDescription>Available time slots for scheduling classes.</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button size="sm" onClick={handleAddTimeSlotClick}>
                      <Plus className="mr-2 h-4 w-4" /> Add Time Slot
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            {isAdmin && <TableHead className="w-[120px] text-right">Actions</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timeSlots.map(slot => {
                            const [start, end] = slot.split(' - ');
                            return (
                                <TableRow key={slot}>
                                    <TableCell>{start || 'N/A'}</TableCell>
                                    <TableCell>{end || 'N/A'}</TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditTimeSlotClick(slot)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTimeSlot(slot)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                        })}
                    </TableBody>
                  </Table>
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
                                <TableCell key={day} className={cn('relative h-24', isAdmin ? "cursor-pointer hover:bg-accent" : "")} onClick={() => isAdmin && (entry ? handleEditClick(entry) : handleAddFromTimetable(day, timeSlot))}>
                                  {entry ? (
                                    <div className="flex flex-col gap-1 text-sm">
                                      <p className="font-semibold">{entry.subject}</p>
                                      <p className="text-xs text-muted-foreground">{entry.faculty}</p>
                                      <p className="text-xs text-muted-foreground">{entry.class}</p>
                                       {isAdmin && <div className="absolute top-1 right-1 p-1 rounded-full hover:bg-background"><Edit className="h-3 w-3 text-muted-foreground"/></div>}
                                    </div>
                                  ) : (isAdmin && 
                                    <div className="flex items-center justify-center h-full text-muted-foreground/50">
                                        <Plus className="h-4 w-4"/>
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
      {isAdmin && (
        <EditTimeSlotModal
            isOpen={isTimingModalOpen}
            onOpenChange={setIsTimingModalOpen}
            timeSlot={selectedTimeSlot}
        />
      )}
    </div>
  );
}
