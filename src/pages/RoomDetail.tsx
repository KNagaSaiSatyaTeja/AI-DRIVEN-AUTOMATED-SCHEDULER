
import { useState, useEffect } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { GenerateTimetableModal } from '@/components/GenerateTimetableModal';

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const { role, generateSchedule, isLoading, getRoomData, saveRoomData, updateRoomSchedule, deleteRoomSchedule } = useApp();
  const { toast } = useToast();
  const isAdmin = role === 'admin';

  // Initialize room-specific data
  const [roomData, setRoomData] = useState(() => {
    if (roomId) {
      const savedData = getRoomData(roomId);
      if (savedData) {
        return savedData;
      }
    }

    // Default room data with proper types
    return {
      schedule: [] as ScheduleEntry[],
      config: {
        collegeTime: { startTime: "09:00", endTime: "17:00" },
        breaks: [{ id: 'b1', day: 'ALL_DAYS' as const, startTime: '13:00', endTime: '14:00' }] as BreakConfig[],
        rooms: [roomId || ''],
        subjects: [] as SubjectConfig[],
        faculty: [] as FacultyConfig[]
      } as TimetableConfig,
      timeSlots: ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00']
    };
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  // Save room data whenever it changes
  useEffect(() => {
    if (roomId && roomData) {
      saveRoomData(roomId, roomData);
    }
  }, [roomData, roomId, saveRoomData]);

  const updateConfig = (newConfig: TimetableConfig) => {
    setRoomData(prev => ({ ...prev, config: newConfig }));
  };

  // Handlers for the timetable view
  const handleEditClick = (entry: ScheduleEntry) => {
    setSelectedEntry(entry);
    setIsEditModalOpen(true);
  };

  const handleAddFromTimetable = (day: string, time: string) => {
    const newEntry: ScheduleEntry = { day, time, room: roomId || '', subject: '', faculty: '', class: '' };
    setSelectedEntry(newEntry);
    setIsEditModalOpen(true);
  };

  const handleScheduleUpdate = (entry: ScheduleEntry) => {
    if (roomId) {
      const updatedSchedule = [...roomData.schedule];
      const entryIndex = updatedSchedule.findIndex(
        e => e.day === entry.day && e.time === entry.time && e.room === entry.room
      );

      if (entryIndex !== -1) {
        updatedSchedule[entryIndex] = entry;
      } else {
        updatedSchedule.push(entry);
      }

      setRoomData(prev => ({ ...prev, schedule: updatedSchedule }));
    }
  };

  const handleScheduleDelete = (entry: ScheduleEntry) => {
    const updatedSchedule = roomData.schedule.filter(
      e => !(e.day === entry.day && e.time === entry.time && e.room === entry.room)
    );
    setRoomData(prev => ({ ...prev, schedule: updatedSchedule }));
  };

  const handleGenerateClick = () => {
    setIsGenerateModalOpen(true);
  };

  const handleConfirmGenerate = async (payload: any) => {
    const result = await generateSchedule({ ...payload, roomId });
    toast({
        title: result.success ? "Timetable Generated" : "Generation Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
    });
    if (result.success && roomId) {
      // Refresh room data after generation
      const updatedData = getRoomData(roomId);
      if (updatedData) {
        setRoomData(updatedData);
      }
      setIsGenerateModalOpen(false);
    }
  };

  // Handlers for config forms
  const handleCollegeTimeChange = (field: keyof CollegeTime, value: string) => {
    setRoomData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        collegeTime: { ...prev.config.collegeTime, [field]: value }
      }
    }));
  };

  const handleAddBreak = () => {
    const newBreak: BreakConfig = { id: `b${Date.now()}`, day: 'ALL_DAYS', startTime: '12:00', endTime: '13:00' };
    setRoomData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        breaks: [...prev.config.breaks, newBreak]
      }
    }));
  };

  const handleDeleteBreak = (id: string) => {
    setRoomData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        breaks: prev.config.breaks.filter(b => b.id !== id)
      }
    }));
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
            <p className="text-muted-foreground">Manage configuration and schedule for this room.</p>
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
            <ManageSubjects config={roomData.config} setConfig={updateConfig} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="faculty" className="mt-4">
            <ManageFaculty config={roomData.config} setConfig={updateConfig} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="breaks" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Breaks</CardTitle>
                        <CardDescription>Define room-specific break times.</CardDescription>
                    </div>
                    {isAdmin && <Button size="sm" onClick={handleAddBreak}><Plus className="mr-2"/> Add Break</Button>}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {roomData.config.breaks.map((breakItem, index) => (
                            <div key={breakItem.id} className="flex items-center gap-4 p-2 border rounded-lg">
                                <Select defaultValue={breakItem.day} disabled={!isAdmin} onValueChange={(value) => {
                                    const newBreaks = [...roomData.config.breaks];
                                    newBreaks[index].day = value as 'ALL_DAYS' | ConfigDay;
                                    setRoomData(prev => ({
                                      ...prev,
                                      config: { ...prev.config, breaks: newBreaks }
                                    }));
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
                                     const newBreaks = [...roomData.config.breaks];
                                     newBreaks[index].startTime = e.target.value;
                                     setRoomData(prev => ({
                                       ...prev,
                                       config: { ...prev.config, breaks: newBreaks }
                                     }));
                                }}/>
                                <Input type="time" value={breakItem.endTime} readOnly={!isAdmin} onChange={(e) => {
                                     const newBreaks = [...roomData.config.breaks];
                                     newBreaks[index].endTime = e.target.value;
                                     setRoomData(prev => ({
                                       ...prev,
                                       config: { ...prev.config, breaks: newBreaks }
                                     }));
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
                    <CardTitle>Room Timings</CardTitle>
                    <CardDescription>Set the operating hours for this room.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <div className="w-full space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input id="startTime" type="time" value={roomData.config.collegeTime.startTime} readOnly={!isAdmin} onChange={(e) => handleCollegeTimeChange('startTime', e.target.value)} />
                    </div>
                    <div className="w-full space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input id="endTime" type="time" value={roomData.config.collegeTime.endTime} readOnly={!isAdmin} onChange={(e) => handleCollegeTimeChange('endTime', e.target.value)} />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="timetable" className="mt-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Room Schedule</CardTitle>
                        <CardDescription>
                            Current timetable for {roomId}. Generate a new one based on room configuration.
                        </CardDescription>
                    </div>
                    {isAdmin && <Button size="sm" onClick={handleGenerateClick}>{roomData.schedule.filter(e => e.subject !== 'Break').length > 0 ? 'Generate New Timetable' : 'Generate Timetable'}</Button>}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[120px]">Day</TableHead>
                          {roomData.timeSlots.map(timeSlot => <TableHead key={timeSlot}>{timeSlot}</TableHead>)}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {originalDays.map(day => (
                          <TableRow key={day}>
                            <TableCell className="font-medium text-muted-foreground">{day}</TableCell>
                            {roomData.timeSlots.map(timeSlot => {
                              const entry = roomData.schedule.find(s => s.day === day && s.time === timeSlot);
                              const isBreak = entry?.subject === 'Break';

                              if (isBreak) {
                                return (
                                    <TableCell key={timeSlot} className={cn('relative h-24 bg-muted/50', isAdmin ? "cursor-pointer hover:bg-accent" : "")} onClick={() => isAdmin && entry && handleEditClick(entry)}>
                                        <div className="flex items-center justify-center h-full text-sm font-medium text-muted-foreground">
                                            Break
                                        </div>
                                        {isAdmin && <div className="absolute top-1 right-1 p-1 rounded-full hover:bg-background"><Edit className="h-3 w-3 text-muted-foreground"/></div>}
                                    </TableCell>
                                )
                              }
                              
                              return (
                                <TableCell key={timeSlot} className={cn('relative h-24', isAdmin ? "cursor-pointer hover:bg-accent" : "")} onClick={() => isAdmin && (entry ? handleEditClick(entry) : handleAddFromTimetable(day, timeSlot))}>
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

      <GenerateTimetableModal
        isOpen={isGenerateModalOpen}
        onOpenChange={setIsGenerateModalOpen}
        config={roomData.config}
        onConfirmGenerate={handleConfirmGenerate}
        isLoading={isLoading}
      />

      {selectedEntry && (
        <EditScheduleModal
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          scheduleEntry={selectedEntry}
          subjects={roomData.config.subjects}
          faculty={roomData.config.faculty}
          rooms={roomData.config.rooms}
          onSave={handleScheduleUpdate}
          onDelete={handleScheduleDelete}
        />
      )}
    </div>
  );
}
