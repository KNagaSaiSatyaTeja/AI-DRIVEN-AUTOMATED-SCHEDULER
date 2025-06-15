
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { days as originalDays, ScheduleEntry, TimetableConfig, configDays, CollegeTime, BreakConfig, SubjectConfig, FacultyConfig, ConfigDay } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Edit, Trash2, Plus } from 'lucide-react';
import { EditScheduleModal } from '@/components/EditScheduleModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ManageSubjects } from '@/components/ManageSubjects';
import { ManageFaculty } from '@/components/ManageFaculty';

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const { role, schedule, timeSlots } = useApp();
  const isAdmin = role === 'admin';

  const [config, setConfig] = useState<TimetableConfig>({
    collegeTime: { startTime: "09:00", endTime: "17:00" },
    breaks: [{ id: 'b1', day: 'ALL_DAYS', startTime: '13:00', endTime: '14:00' }],
    rooms: ['A-101', 'B-203', 'C-305'],
    subjects: [
      { id: 's1', name: 'Quantum Physics', duration: 50, no_of_classes_per_week: 3, facultyIds: ['f1'] }
    ],
    faculty: [
      { id: 'f1', name: 'Dr. Evelyn Reed', availability: [{ day: 'MONDAY', startTime: '09:00', endTime: '17:00' }] }
    ]
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

  const roomSchedule = schedule.filter(entry => entry.room === roomId);
  const roomExists = schedule.some(entry => entry.room === roomId);

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

  // Handlers for the original timetable view
  const handleEditClick = (entry: ScheduleEntry) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };
  const handleAddFromTimetable = (day: string, time: string) => {
    const newEntry: ScheduleEntry = { day, time, room: roomId || '', subject: '', faculty: '', class: '' };
    setSelectedEntry(newEntry);
    setIsEditModalOpen(true);
  };

  // Handler for generating timetable (placeholder)
  const handleGenerateTimetable = () => {
    alert('This feature will automatically generate a timetable based on the new configuration. It is not yet implemented.');
  };

  // Handlers for the new config forms
  const handleCollegeTimeChange = (field: keyof CollegeTime, value: string) => {
    setConfig(prev => ({ ...prev, collegeTime: { ...prev.collegeTime, [field]: value } }));
  };

  const handleAddBreak = () => {
    const newBreak: BreakConfig = { id: `b${Date.now()}`, day: 'ALL_DAYS', startTime: '12:00', endTime: '13:00' };
    setConfig(prev => ({...prev, breaks: [...prev.breaks, newBreak] }));
  }

  const handleDeleteBreak = (id: string) => {
    setConfig(prev => ({...prev, breaks: prev.breaks.filter(b => b.id !== id)}));
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
            <p className="text-muted-foreground">Manage configuration or view the current schedule for this room.</p>
        </div>
      </div>
      
      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="faculty">Faculty</TabsTrigger>
            <TabsTrigger value="breaks">Breaks</TabsTrigger>
            <TabsTrigger value="timings">Timings</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-4">
            <ManageSubjects config={config} setConfig={setConfig} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="faculty" className="mt-4">
            <ManageFaculty config={config} setConfig={setConfig} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="breaks" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Breaks</CardTitle>
                        <CardDescription>Define college-wide break times.</CardDescription>
                    </div>
                    {isAdmin && <Button size="sm" onClick={handleAddBreak}><Plus className="mr-2"/> Add Break</Button>}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {config.breaks.map((breakItem, index) => (
                            <div key={breakItem.id} className="flex items-center gap-4 p-2 border rounded-lg">
                                <Select defaultValue={breakItem.day} disabled={!isAdmin} onValueChange={(value) => {
                                    const newBreaks = [...config.breaks];
                                    newBreaks[index].day = value as 'ALL_DAYS' | ConfigDay;
                                    setConfig(prev => ({...prev, breaks: newBreaks}));
                                }}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL_DAYS">All Days</SelectItem>
                                        {configDays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input type="time" value={breakItem.startTime} readOnly={!isAdmin} onChange={(e) => {
                                     const newBreaks = [...config.breaks];
                                     newBreaks[index].startTime = e.target.value;
                                     setConfig(prev => ({...prev, breaks: newBreaks}));
                                }}/>
                                <Input type="time" value={breakItem.endTime} readOnly={!isAdmin} onChange={(e) => {
                                     const newBreaks = [...config.breaks];
                                     newBreaks[index].endTime = e.target.value;
                                     setConfig(prev => ({...prev, breaks: newBreaks}));
                                }}/>
                                {isAdmin && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteBreak(breakItem.id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="timings" className="mt-4">
            <Card>
                <CardHeader>
                    <CardTitle>College Timings</CardTitle>
                    <CardDescription>Set the official start and end times for the college day.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <div className="w-full space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input id="startTime" type="time" value={config.collegeTime.startTime} readOnly={!isAdmin} onChange={(e) => handleCollegeTimeChange('startTime', e.target.value)} />
                    </div>
                    <div className="w-full space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input id="endTime" type="time" value={config.collegeTime.endTime} readOnly={!isAdmin} onChange={(e) => handleCollegeTimeChange('endTime', e.target.value)} />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="timetable" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Weekly Schedule</CardTitle>
                        <CardDescription>
                            This is the current, active timetable. Generate a new one based on your configuration.
                        </CardDescription>
                    </div>
                    {isAdmin && <Button size="sm" onClick={handleGenerateTimetable}>{roomSchedule.length > 0 ? 'Generate New Timetable' : 'Generate Timetable'}</Button>}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Time</TableHead>
                          {originalDays.map(day => <TableHead key={day}>{day}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeSlots.map(timeSlot => (
                          <TableRow key={timeSlot}>
                            <TableCell className="font-medium text-muted-foreground">{timeSlot}</TableCell>
                            {originalDays.map(day => {
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
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          scheduleEntry={selectedEntry}
          subjects={config.subjects}
          faculty={config.faculty}
          rooms={config.rooms}
        />
      )}
    </div>
  );
}
