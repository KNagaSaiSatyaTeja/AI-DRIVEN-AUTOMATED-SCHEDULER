
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimetableConfig } from "@/data/schedule";
import { Loader2 } from "lucide-react";

interface GenerateTimetableModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  config: TimetableConfig;
  onGenerateSuccess: (payload: any) => void;
  isLoading: boolean;
}

export function GenerateTimetableModal({
  isOpen,
  onOpenChange,
  config,
  onGenerateSuccess,
  isLoading,
}: GenerateTimetableModalProps) {
  const [generations, setGenerations] = useState(1);
  const [maxIterations, setMaxIterations] = useState(100);

  const handleGenerate = () => {
    const payload = {
      subjects: config.subjects.map((s) => ({
        name: s.name,
        time: s.duration,
        no_of_classes_per_week: s.no_of_classes_per_week,
        faculty: s.facultyIds.map((facultyId) => {
          const faculty = config.faculty.find((f) => f.id === facultyId);
          return {
            id: faculty?.id || facultyId,
            name: faculty?.name || "Unknown Faculty",
            availability: faculty?.availability || [],
          };
        }),
      })),
      break_: config.breaks.map((b) => ({
        day: b.day,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      college_time: {
        startTime: config.collegeTime.startTime,
        endTime: config.collegeTime.endTime,
      },
      generations,
      max_iterations: maxIterations,
    };

    onGenerateSuccess(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Timetable</DialogTitle>
          <DialogDescription>
            Configure generation parameters for the AI scheduler.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="generations" className="text-right">
              Generations
            </Label>
            <Input
              id="generations"
              type="number"
              value={generations}
              onChange={(e) => setGenerations(Number(e.target.value))}
              className="col-span-3"
              min={1}
              max={10}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="iterations" className="text-right">
              Max Iterations
            </Label>
            <Input
              id="iterations"
              type="number"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number(e.target.value))}
              className="col-span-3"
              min={50}
              max={1000}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
