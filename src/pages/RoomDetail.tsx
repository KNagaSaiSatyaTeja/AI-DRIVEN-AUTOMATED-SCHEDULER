
import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scheduleData, days, timeSlots, ScheduleEntry } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { Edit } from 'lucide-react';
import { EditScheduleModal } from '@/components/EditScheduleModal';
import { Badge } from '@/components/ui/badge';

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const { role } = useApp();
  const isAdmin = role === 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

  const roomSchedule = scheduleData.filter(entry => entry.room === roomId);
  const roomExists = scheduleData.some(entry => entry.room === roomId);
  const subjects = [...new Set(roomSchedule.map(e => e.subject).filter(s => s && s !== 'Break'))];
  const faculty = [...new Set(roomSchedule.map(e => e.faculty).filter(f => f))];

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
            <h1 className="text-2xl font-bold">Management for Room: {roomId}</h1>
            <p className="text-muted-foreground">
                Admins can click on a slot to edit.
            </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Room Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-4 text-sm">
            {subjects.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 text-muted-foreground">Subjects Taught</h4>
                    <div className="flex flex-wrap gap-2">
                        {subjects.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
                    </div>
                </div>
            )}
            {faculty.length > 0 && (
                <div>
                    <h4 className="font-semibold mb-2 text-muted-foreground">Associated Faculty</h4>
                    <div className="flex flex-wrap gap-2">
                        {faculty.map(f => <Badge key={f} variant="outline">{f}</Badge>)}
                    </div>
                </div>
            )}
            {(subjects.length === 0 && faculty.length === 0) && (
                <p className="text-muted-foreground">No subjects or faculty assigned to this room yet.</p>
            )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
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
