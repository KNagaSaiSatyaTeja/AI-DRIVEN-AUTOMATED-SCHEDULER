
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
import { Button } from "@/components/ui/button";
import { Plus, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface ScheduleEntry {
  subject_name: string;
  faculty_id: string;
  faculty_name: string;
  day: string;
  startTime: string;
  endTime: string;
  room_id: string;
  is_special: boolean;
  priority_score: number;
}

interface WeeklySchedule {
  time_slots: string[];
  days: {
    [key: string]: ScheduleEntry[];
  };
}

interface TimetableData {
  weekly_schedule: WeeklySchedule;
  unassigned: any[];
  fitness: number;
  preference_score: number;
  break_slots: number;
  total_assignments: number;
  total_available_slots: number;
  utilization_percentage: number;
  subject_coverage: any;
  guaranteed_100_percent: boolean;
}

export function Timetable() {
  const { role, selectedRoom } = useApp();
  const isAdmin = role === "admin";
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayMapping: { [key: string]: string } = {
    Monday: "MONDAY",
    Tuesday: "TUESDAY", 
    Wednesday: "WEDNESDAY",
    Thursday: "THURSDAY",
    Friday: "FRIDAY",
    Saturday: "SATURDAY"
  };

  useEffect(() => {
    const fetchTimetableData = async () => {
      if (!selectedRoom) return;
      
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/timetable/room/${selectedRoom}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        
        if (response.data && response.data.length > 0) {
          // Get the most recent timetable
          const latestTimetable = response.data[0];
          setTimetableData(latestTimetable);
        }
      } catch (error) {
        console.error("Error fetching timetable data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetableData();
  }, [selectedRoom]);

  const getScheduleForDayAndTime = (day: string, timeSlot: string): ScheduleEntry | null => {
    if (!timetableData?.weekly_schedule) return null;
    
    const dayKey = dayMapping[day];
    const daySchedule = timetableData.weekly_schedule.days[dayKey] || [];
    
    return daySchedule.find(entry => 
      `${entry.startTime}-${entry.endTime}` === timeSlot
    ) || null;
  };

  const formatTimeSlot = (timeSlot: string) => {
    return timeSlot.replace('-', ' - ');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-lg">Loading timetable...</div>
        </CardContent>
      </Card>
    );
  }

  if (!timetableData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">No timetable data available</div>
        </CardContent>
      </Card>
    );
  }

  const timeSlots = timetableData.weekly_schedule.time_slots || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Weekly Schedule</h2>
          <p className="text-muted-foreground">
            This is the current, active timetable. Generate a new one based on your configuration.
          </p>
        </div>
        <Button size="lg" className="bg-black text-white hover:bg-gray-800">
          Generate New Timetable
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] font-semibold">Day</TableHead>
                  {timeSlots.map((timeSlot) => (
                    <TableHead key={timeSlot} className="text-center min-w-[180px]">
                      {formatTimeSlot(timeSlot)}
                    </TableHead>
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
                      const entry = getScheduleForDayAndTime(day, timeSlot);
                      
                      return (
                        <TableCell key={timeSlot} className="text-center p-2">
                          {entry ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">{entry.subject_name}</p>
                                  <p className="text-xs text-muted-foreground">{entry.faculty_name}</p>
                                  <p className="text-xs text-muted-foreground">MSc Physics</p>
                                </div>
                                {isAdmin && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-16">
                              {isAdmin && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
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
    </div>
  );
}
