import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  TimetableConfig,
  CollegeTime,
  BreakConfig,
  configDays,
} from "@/data/schedule";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCallback } from "react";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";

// Update the Subject interface to match your actual backend structure
interface Subject {
  _id: string;
  name: string;
  time: number; // Your backend uses 'time' instead of 'duration'
  noOfClassesPerWeek: number; // Your backend uses 'noOfClassesPerWeek' instead of 'no_of_classes_per_week'
  faculty: Array<{
    _id: string;
    facultyId: string;
    name: string;
    room: string;
    availability: unknown[];
  }>; // Faculty is an array of objects, not just IDs
  isSpecial: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GenerateTimetableModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  config: TimetableConfig;
  onGenerateSuccess: (payload: unknown) => void;
  isLoading: boolean;
}

export function GenerateTimetableModal({
  isOpen,
  onOpenChange,
  config,
  onGenerateSuccess,
  isLoading,
}: GenerateTimetableModalProps) {
  const { selectedRoom } = useApp();
  const [localConfig, setLocalConfig] = useState<TimetableConfig>(config);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // New state for backend subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  // Fetch subjects from backend
  const fetchSubjects = useCallback(async () => {
    if (!selectedRoom) return;

    setSubjectsLoading(true);
    setSubjectsError(null);

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/subject/room/${selectedRoom}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.data) {
        throw new Error(
          `Failed to fetch subjects: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.data;
      const subjectsData = data.subjects || data.data || data;

      console.log("Raw subjects data:", subjectsData);
      setSubjects(subjectsData);

      // Pre-select all subjects by default - use _id consistently
      const subjectIds = subjectsData.map((s: Subject) => s._id);
      console.log("Setting subject IDs:", subjectIds);
      setSelectedSubjectIds(subjectIds);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjectsError(
        error instanceof Error ? error.message : "Failed to fetch subjects"
      );

      // Fallback to config subjects if backend fails
      const fallbackSubjects = config.subjects.map((s) => ({
        _id: s._id ?? Math.random().toString(),
        name: s.name,
        time: s.duration, // Map duration to time
        noOfClassesPerWeek: s.no_of_classes_per_week, // Map field names
        faculty: [], // Empty faculty array for fallback
        isSpecial: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      setSubjects(fallbackSubjects);
      setSelectedSubjectIds(fallbackSubjects.map((s) => s._id));
    } finally {
      setSubjectsLoading(false);
    }
  }, [config.subjects, selectedRoom]);

  // Reset subjects and selection when room changes
  useEffect(() => {
    console.log("Room changed to:", selectedRoom);
    setSubjects([]);
    setSelectedSubjectIds([]);
    setSubjectsError(null);
  }, [selectedRoom]);

  useEffect(() => {
    if (isOpen && selectedRoom) {
      setLocalConfig(config);
      fetchSubjects();
    }
  }, [isOpen, config, fetchSubjects, selectedRoom]);

  // Add useEffect to log selectedSubjectIds changes
  useEffect(() => {
    console.log("Selected subject IDs updated:", selectedSubjectIds);
  }, [selectedSubjectIds]);

  const handleCollegeTimeChange = (field: keyof CollegeTime, value: string) => {
    setLocalConfig((prev) => ({
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
    setLocalConfig((prev) => ({ ...prev, breaks: [...prev.breaks, newBreak] }));
  };

  const handleDeleteBreak = (id: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      breaks: prev.breaks.filter((b) => b.id !== id),
    }));
  };

  const handleBreakChange = (
    index: number,
    field: keyof Omit<BreakConfig, "id">,
    value: string
  ) => {
    const newBreaks = [...localConfig.breaks];
    const breakToUpdate = { ...newBreaks[index] };
    (breakToUpdate as unknown)[field] = value;
    newBreaks[index] = breakToUpdate;
    setLocalConfig((prev) => ({ ...prev, breaks: newBreaks }));
  };

  const handleSubjectSelectionChange = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleRetryFetchSubjects = () => {
    fetchSubjects();
  };

  const handleConfirm = () => {
    if (!selectedRoom) {
      toast({
        title: "Room Required",
        description: "Please select a room first",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    console.log("Selected subjects:", selectedSubjectIds);
    console.log("All subjects data:", subjects);
    console.log("Local config college time:", localConfig.collegeTime);

    if (
      !localConfig.collegeTime ||
      !localConfig.collegeTime.startTime ||
      !localConfig.collegeTime.endTime
    ) {
      toast({
        title: "Configuration Error",
        description: "College time configuration is missing",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (selectedSubjectIds.length === 0) {
      toast({
        title: "Subjects Required",
        description: "Please select at least one subject",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const selectedSubjectsDetails = subjects
      .filter((subject) => selectedSubjectIds.includes(subject._id))
      .map((subject) => {
        console.log("Processing subject:", subject);

        // Transform faculty data to match the required API format
        const faculties = subject.faculty.map((facultyMember) => ({
          id: facultyMember._id, // Use facultyId if available, fallback to _id
          name: facultyMember.name,
          availability: facultyMember.availability, // Ensure availability is always an array
        }));

        console.log("Subject faculties with availability:", faculties);

        // Transform subject to match API format
        const subjectDetail = {
          name: subject.name,
          time: subject.time, // Keep as 'time' for API
          no_of_classes_per_week: subject.noOfClassesPerWeek, // Convert to API format
          faculty: JSON.stringify(faculties),
        };

        console.log("Final subject detail:", subjectDetail);
        return subjectDetail;
      });

    // Build payload to match the exact API format
    const payload = {
      subjects: selectedSubjectsDetails,
      break_: localConfig.breaks.map((b) => ({
        day: b.day,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      college_time: {
        startTime: localConfig.collegeTime.startTime,
        endTime: localConfig.collegeTime.endTime,
      },
      rooms: [selectedRoom],
    };

    console.log("Generated payload:", JSON.stringify(payload, null, 2));

    onGenerateSuccess(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate New Timetable</DialogTitle>
          <DialogDescription>
            Adjust configuration for this generation. These changes won't be
            saved permanently.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-3">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                Subjects
                {subjectsLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </CardTitle>
              <CardDescription>
                Select subjects to include in the timetable.
                {selectedRoom && (
                  <span className="block text-xs mt-1">
                    Room: {selectedRoom}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {!selectedRoom && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please select a room to load subjects.
                  </AlertDescription>
                </Alert>
              )}

              {subjectsError && selectedRoom && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{subjectsError}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryFetchSubjects}
                      disabled={subjectsLoading}
                    >
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {subjectsLoading && selectedRoom ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Loading subjects for selected room...
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {subjects.map((subject) => (
                    <div
                      key={subject._id}
                      className="flex items-start space-x-2 p-2 border rounded"
                    >
                      <Checkbox
                        id={`subject-${subject._id}`}
                        checked={selectedSubjectIds.includes(subject._id)}
                        onCheckedChange={() =>
                          handleSubjectSelectionChange(subject._id)
                        }
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={`subject-${subject._id}`}
                          className="font-normal cursor-pointer"
                        >
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {subject.noOfClassesPerWeek} classes/week •{" "}
                            {subject.time} min duration
                          </div>
                          {subject.faculty && subject.faculty.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Faculty:{" "}
                              {subject.faculty.map((f) => f.name).join(", ")}
                            </div>
                          )}
                        </Label>
                      </div>
                    </div>
                  ))}
                  {subjects.length === 0 && !subjectsError && selectedRoom && (
                    <p className="text-sm text-muted-foreground">
                      No subjects found for this room.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Breaks</CardTitle>
              <Button size="sm" variant="outline" onClick={handleAddBreak}>
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {localConfig.breaks.map((breakItem, index) => (
                  <div key={breakItem.id} className="flex items-center gap-2">
                    <Select
                      value={breakItem.day}
                      onValueChange={(value) =>
                        handleBreakChange(index, "day", value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
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
                      onChange={(e) =>
                        handleBreakChange(index, "startTime", e.target.value)
                      }
                    />
                    <Input
                      type="time"
                      value={breakItem.endTime}
                      onChange={(e) =>
                        handleBreakChange(index, "endTime", e.target.value)
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteBreak(breakItem.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">College Timings</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <div className="w-full space-y-1">
                <Label htmlFor="startTime-modal">Start Time</Label>
                <Input
                  id="startTime-modal"
                  type="time"
                  value={localConfig.collegeTime.startTime}
                  onChange={(e) =>
                    handleCollegeTimeChange("startTime", e.target.value)
                  }
                />
              </div>
              <div className="w-full space-y-1">
                <Label htmlFor="endTime-modal">End Time</Label>
                <Input
                  id="endTime-modal"
                  type="time"
                  value={localConfig.collegeTime.endTime}
                  onChange={(e) =>
                    handleCollegeTimeChange("endTime", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              isLoading ||
              subjectsLoading ||
              selectedSubjectIds.length === 0 ||
              !selectedRoom
            }
          >
            {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Confirm & Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
