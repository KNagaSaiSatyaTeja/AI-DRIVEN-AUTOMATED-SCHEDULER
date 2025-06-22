// import { useState, useEffect } from 'react';
// import { useParams, Link } from 'react-router-dom';
// import { TimetableConfig, BreakConfig, SubjectConfig, FacultyConfig, ConfigDay, configDays, CollegeTime } from '@/data/schedule';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { useApp } from '@/context/AppContext';
// import { Plus, Trash2 } from 'lucide-react';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { ManageSubjects } from '@/components/ManageSubjects';
// import { ManageFaculty } from '@/components/ManageFaculty';
// import { useToast } from '@/components/ui/use-toast';
// import { GenerateTimetableModal } from '@/components/GenerateTimetableModal';

// export default function RoomDetail() {
//   const { roomId } = useParams<{ roomId: string }>();
//   const { role, generateSchedule, isLoading, getTimetables } = useApp();
//   const { toast } = useToast();
//   const isAdmin = role === 'admin';

//   const [config, setConfig] = useState<TimetableConfig>({
//     collegeTime: { startTime: "09:00", endTime: "17:00" },
//     breaks: [{ id: 'b1', day: 'ALL_DAYS' as const, startTime: '13:00', endTime: '14:00' }],
//     rooms: [roomId || ''],
//     subjects: [],
//     faculty: []
//   });

//   const [timetables, setTimetables] = useState<any[]>([]);
//   const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const data = await getTimetables();
//         setTimetables(data);

//         // Find existing config for this room
//         const roomTimetable = data.find(t => t.rooms?.includes(roomId));
//         if (roomTimetable) {
//           setConfig({
//             collegeTime: roomTimetable.collegeTime || config.collegeTime,
//             breaks: roomTimetable.breaks || config.breaks,
//             rooms: [roomId || ''],
//             subjects: roomTimetable.subjects || [],
//             faculty: roomTimetable.subjects?.map((s: any) => s.faculty).flat() || []
//           });
//         }
//       } catch (error) {
//         console.error('Error fetching timetable data:', error);
//         toast({
//           title: "Error",
//           description: "Failed to load room data",
//           variant: "destructive"
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (roomId) {
//       fetchData();
//     }
//   }, [roomId, getTimetables, toast]);

//   const handleCollegeTimeChange = (field: keyof CollegeTime, value: string) => {
//     setConfig(prev => ({
//       ...prev,
//       collegeTime: { ...prev.collegeTime, [field]: value }
//     }));
//   };

//   const handleAddBreak = () => {
//     const newBreak: BreakConfig = {
//       id: `b${Date.now()}`,
//       day: 'ALL_DAYS',
//       startTime: '12:00',
//       endTime: '13:00'
//     };
//     setConfig(prev => ({
//       ...prev,
//       breaks: [...prev.breaks, newBreak]
//     }));
//   };

//   const handleDeleteBreak = (id: string) => {
//     setConfig(prev => ({
//       ...prev,
//       breaks: prev.breaks.filter(b => b.id !== id)
//     }));
//   };

//   const handleGenerateClick = () => {
//     setIsGenerateModalOpen(true);
//   };

//   const handleConfirmGenerate = async (payload: any) => {
//     const result = await generateSchedule(payload);
//     toast({
//       title: result.success ? "Timetable Generated" : "Generation Failed",
//       description: result.message,
//       variant: result.success ? "default" : "destructive",
//     });
//     if (result.success) {
//       setIsGenerateModalOpen(false);
//       // Refresh data
//       const data = await getTimetables();
//       setTimetables(data);
//     }
//   };

//   const updateBreak = (index: number, field: keyof BreakConfig, value: any) => {
//     setConfig(prev => {
//       const newBreaks = [...prev.breaks];
//       newBreaks[index] = { ...newBreaks[index], [field]: value };
//       return { ...prev, breaks: newBreaks };
//     });
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-lg">Loading room data...</div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <Button asChild variant="outline" size="sm" className="mb-4">
//             <Link to="/rooms">Back to All Rooms</Link>
//           </Button>
//           <h1 className="text-2xl font-bold">Room: {roomId}</h1>
//           <p className="text-muted-foreground">Manage configuration and schedule for this room.</p>
//         </div>
//       </div>

//       <Tabs defaultValue="subjects" className="w-full">
//         <TabsList className="grid w-full grid-cols-4">
//           <TabsTrigger value="subjects">Subjects</TabsTrigger>
//           <TabsTrigger value="faculty">Faculty</TabsTrigger>
//           <TabsTrigger value="breaks">Breaks</TabsTrigger>
//           <TabsTrigger value="timings">Timings</TabsTrigger>
//         </TabsList>

//         <TabsContent value="subjects" className="mt-4">
//           <ManageSubjects config={config} setConfig={setConfig} isAdmin={isAdmin} />
//         </TabsContent>

//         <TabsContent value="faculty" className="mt-4">
//           <ManageFaculty config={config} setConfig={setConfig} isAdmin={isAdmin} />
//         </TabsContent>

//         <TabsContent value="breaks" className="mt-4">
//           <Card>
//             <CardHeader className="flex flex-row items-center justify-between">
//               <div>
//                 <CardTitle>Manage Breaks</CardTitle>
//                 <CardDescription>Define room-specific break times.</CardDescription>
//               </div>
//               {isAdmin && <Button size="sm" onClick={handleAddBreak}><Plus className="mr-2"/> Add Break</Button>}
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {config.breaks.map((breakItem, index) => (
//                   <div key={breakItem.id} className="flex items-center gap-4 p-2 border rounded-lg">
//                     <Select
//                       defaultValue={breakItem.day}
//                       disabled={!isAdmin}
//                       onValueChange={(value) => updateBreak(index, 'day', value)}
//                     >
//                       <SelectTrigger className="w-[180px]">
//                         <SelectValue placeholder="Select day" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="ALL_DAYS">All Days</SelectItem>
//                         {configDays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
//                       </SelectContent>
//                     </Select>
//                     <Input
//                       type="time"
//                       value={breakItem.startTime}
//                       readOnly={!isAdmin}
//                       onChange={(e) => updateBreak(index, 'startTime', e.target.value)}
//                     />
//                     <Input
//                       type="time"
//                       value={breakItem.endTime}
//                       readOnly={!isAdmin}
//                       onChange={(e) => updateBreak(index, 'endTime', e.target.value)}
//                     />
//                     {isAdmin && (
//                       <Button variant="ghost" size="icon" onClick={() => handleDeleteBreak(breakItem.id)}>
//                         <Trash2 className="h-4 w-4 text-destructive" />
//                       </Button>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>

//         <TabsContent value="timings" className="mt-4">
//           <Card>
//             <CardHeader>
//               <CardTitle>Room Timings</CardTitle>
//               <CardDescription>Set the operating hours for this room.</CardDescription>
//             </CardHeader>
//             <CardContent className="flex gap-4">
//               <div className="w-full space-y-2">
//                 <Label htmlFor="startTime">Start Time</Label>
//                 <Input
//                   id="startTime"
//                   type="time"
//                   value={config.collegeTime.startTime}
//                   readOnly={!isAdmin}
//                   onChange={(e) => handleCollegeTimeChange('startTime', e.target.value)}
//                 />
//               </div>
//               <div className="w-full space-y-2">
//                 <Label htmlFor="endTime">End Time</Label>
//                 <Input
//                   id="endTime"
//                   type="time"
//                   value={config.collegeTime.endTime}
//                   readOnly={!isAdmin}
//                   onChange={(e) => handleCollegeTimeChange('endTime', e.target.value)}
//                 />
//               </div>
//             </CardContent>
//           </Card>
//         </TabsContent>
//       </Tabs>

//       <div className="flex justify-center">
//         {isAdmin && (
//           <Button size="lg" onClick={handleGenerateClick}>
//             Generate Timetable for {roomId}
//           </Button>
//         )}
//       </div>

//       <GenerateTimetableModal
//         isOpen={isGenerateModalOpen}
//         onOpenChange={setIsGenerateModalOpen}
//         config={config}
//         onConfirmGenerate={handleConfirmGenerate}
//         isLoading={isLoading}
//       />
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  TimetableConfig,
  BreakConfig,
  SubjectConfig,
  FacultyConfig,
  ConfigDay,
  configDays,
  CollegeTime,
} from "@/data/schedule";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context/AppContext";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ManageSubjects } from "@/components/ManageSubjects";
import { ManageFaculty } from "@/components/ManageFaculty";
import { useToast } from "@/components/ui/use-toast";
import { GenerateTimetableModal } from "@/components/GenerateTimetableModal";
import axios from "axios";

export default function RoomDetail() {
  const { roomId } = useParams<{ roomId: string }>();
  const { role, setIsLoading } = useApp();
  const { toast } = useToast();
  const isAdmin = role === "admin";

  const [config, setConfig] = useState<TimetableConfig>({
    collegeTime: { startTime: "09:00", endTime: "17:00" },
    breaks: [
      {
        id: "b1",
        day: "ALL_DAYS" as const,
        startTime: "13:00",
        endTime: "14:00",
      },
    ],
    rooms: [roomId || ""],
    subjects: [],
    faculty: [],
  });

  const [timetables, setTimetables] = useState<any[]>([]);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/timetable/room/${roomId}`
        );
        const roomTimetable = response.data;
        setTimetables([roomTimetable]);
        setConfig({
          collegeTime: roomTimetable.collegeTime || config.collegeTime,
          breaks: roomTimetable.breaks || config.breaks,
          rooms: [roomId || ""],
          subjects: roomTimetable.subjects || [],
          faculty: roomTimetable.faculty || [],
        });
      } catch (error) {
        console.error("Error fetching timetable data:", error);
        toast({
          title: "Error",
          description: "Failed to load room data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (roomId) {
      fetchData();
    }
  }, [roomId, toast, setIsLoading]);

  const handleCollegeTimeChange = (field: keyof CollegeTime, value: string) => {
    setConfig((prev) => ({
      ...prev,
      collegeTime: { ...prev.collegeTime, [field]: value },
    }));
  };

  const handleAddBreak = () => {
    const newBreak: BreakConfig = {
      id: `b${Date.now()}`,
      day: "ALL_DAYS",
      startTime: "12:00",
      endTime: "13:00",
    };
    setConfig((prev) => ({
      ...prev,
      breaks: [...prev.breaks, newBreak],
    }));
  };

  const handleDeleteBreak = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      breaks: prev.breaks.filter((b) => b.id !== id),
    }));
  };

  const handleGenerateClick = () => {
    setIsGenerateModalOpen(true);
  };

  const handleGenerateSuccess = async (payload: any) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/timetable/room/${roomId}/generate`,
        payload
      );
      const result = response.data;
      toast({
        title: result.success ? "Timetable Generated" : "Generation Failed",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
      if (result.success) {
        setIsGenerateModalOpen(false);
        const data = await axios.get(
          `${import.meta.env.VITE_APP_API_BASE_URL}/timetable/room/${roomId}`
        );
        setTimetables([data.data]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate timetable.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateBreak = (index: number, field: keyof BreakConfig, value: any) => {
    setConfig((prev) => {
      const newBreaks = [...prev.breaks];
      newBreaks[index] = { ...newBreaks[index], [field]: value };
      return { ...prev, breaks: newBreaks };
    });
  };

  if (timetables.length === 0 && !isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading room data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="outline" size="sm" className="mb-4">
            <Link to="/rooms">Back to All Rooms</Link>
          </Button>
          <h1 className="text-2xl font-bold">Room: {roomId}</h1>
          <p className="text-muted-foreground">
            Manage configuration and schedule for this room.
          </p>
        </div>
      </div>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="faculty">Faculty</TabsTrigger>
          <TabsTrigger value="breaks">Breaks</TabsTrigger>
          <TabsTrigger value="timings">Timings</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="mt-4">
          <ManageSubjects
            config={config}
            setConfig={setConfig}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="faculty" className="mt-4">
          <ManageFaculty
            config={config}
            setConfig={setConfig}
            isAdmin={isAdmin}
          />
        </TabsContent>

        <TabsContent value="breaks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Manage Breaks</CardTitle>
                <CardDescription>
                  Define room-specific break times.
                </CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={handleAddBreak}>
                  <Plus className="mr-2" /> Add Break
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {config.breaks.map((breakItem, index) => (
                  <div
                    key={breakItem.id}
                    className="flex items-center gap-4 p-2 border rounded-lg"
                  >
                    <Select
                      defaultValue={breakItem.day}
                      disabled={!isAdmin}
                      onValueChange={(value) =>
                        updateBreak(index, "day", value)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL_DAYS">All Days</SelectItem>
                        {configDays.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={breakItem.startTime}
                      readOnly={!isAdmin}
                      onChange={(e) =>
                        updateBreak(index, "startTime", e.target.value)
                      }
                    />
                    <Input
                      type="time"
                      value={breakItem.endTime}
                      readOnly={!isAdmin}
                      onChange={(e) =>
                        updateBreak(index, "endTime", e.target.value)
                      }
                    />
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBreak(breakItem.id)}
                      >
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
              <CardDescription>
                Set the operating hours for this room.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="w-full space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={config.collegeTime.startTime}
                  readOnly={!isAdmin}
                  onChange={(e) =>
                    handleCollegeTimeChange("startTime", e.target.value)
                  }
                />
              </div>
              <div className="w-full space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={config.collegeTime.endTime}
                  readOnly={!isAdmin}
                  onChange={(e) =>
                    handleCollegeTimeChange("endTime", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        {isAdmin && (
          <Button size="lg" onClick={handleGenerateClick}>
            Generate Timetable for {roomId}
          </Button>
        )}
      </div>

      <GenerateTimetableModal
        isOpen={isGenerateModalOpen}
        onOpenChange={setIsGenerateModalOpen}
        config={config}
        onGenerateSuccess={handleGenerateSuccess}
        isLoading={false} // Controlled by setIsLoading
      />
    </div>
  );
}
