import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TimetableConfig, CollegeTime, BreakConfig, configDays } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface GenerateTimetableModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  config: TimetableConfig;
  onConfirmGenerate: (payload: any) => void;
  isLoading: boolean;
}

export function GenerateTimetableModal({ isOpen, onOpenChange, config, onConfirmGenerate, isLoading }: GenerateTimetableModalProps) {
  const [localConfig, setLocalConfig] = useState<TimetableConfig>(config);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setSelectedSubjectIds(config.subjects.map(s => s.id));
    }
  }, [isOpen, config]);

  const handleCollegeTimeChange = (field: keyof CollegeTime, value: string) => {
    setLocalConfig(prev => ({ ...prev, collegeTime: { ...prev.collegeTime, [field]: value } }));
  };

  const handleAddBreak = () => {
    const newBreak: BreakConfig = { id: `b${Date.now()}`, day: 'ALL_DAYS', startTime: '12:00', endTime: '13:00' };
    setLocalConfig(prev => ({...prev, breaks: [...prev.breaks, newBreak] }));
  }

  const handleDeleteBreak = (id: string) => {
    setLocalConfig(prev => ({...prev, breaks: prev.breaks.filter(b => b.id !== id)}));
  }
  
  const handleBreakChange = (index: number, field: keyof Omit<BreakConfig, 'id'>, value: string) => {
    const newBreaks = [...localConfig.breaks];
    const breakToUpdate = { ...newBreaks[index] };
    (breakToUpdate as any)[field] = value;
    newBreaks[index] = breakToUpdate;
    setLocalConfig(prev => ({...prev, breaks: newBreaks}));
  };

  const handleSubjectSelectionChange = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
        prev.includes(subjectId)
            ? prev.filter(id => id !== subjectId)
            : [...prev, subjectId]
    );
  };
  
  const handleConfirm = () => {
    const selectedSubjectsDetails = config.subjects
      .filter(subject => selectedSubjectIds.includes(subject.id))
      .map(subject => {
        const faculties = config.faculty
          .filter(faculty => subject.facultyIds.includes(faculty.id))
          .map(faculty => ({
            id: faculty.id,
            name: faculty.name,
            availability: faculty.availability,
          }));
        return {
          name: subject.name,
          duration: subject.duration,
          time: subject.duration,
          no_of_classes_per_week: subject.no_of_classes_per_week,
          faculty: faculties,
        };
      });

    const payload = {
      college_time: localConfig.collegeTime,
      break_: localConfig.breaks.map(b => ({
        day: b.day,
        startTime: b.startTime,
        endTime: b.endTime,
      })),
      rooms: localConfig.rooms,
      subjects: selectedSubjectsDetails,
    };

    console.log("Generated data from form:", JSON.stringify(payload, null, 2));
    onConfirmGenerate(payload);
    // onOpenChange(false); // This is now handled in RoomDetail.tsx on success
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate New Timetable</DialogTitle>
          <DialogDescription>
            Adjust configuration for this generation. These changes won't be saved permanently.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-3">
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Subjects</CardTitle>
                    <CardDescription>Select subjects to include in the timetable.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    {config.subjects.map(subject => (
                        <div key={subject.id} className="flex items-center space-x-2">
                            <Checkbox
                                id={`subject-${subject.id}`}
                                checked={selectedSubjectIds.includes(subject.id)}
                                onCheckedChange={() => handleSubjectSelectionChange(subject.id)}
                            />
                            <Label htmlFor={`subject-${subject.id}`} className="font-normal">
                                {subject.name}
                            </Label>
                        </div>
                    ))}
                    {config.subjects.length === 0 && <p className="text-sm text-muted-foreground">No subjects configured.</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="text-lg">Breaks</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleAddBreak}><Plus className="mr-1 h-4 w-4"/> Add</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {localConfig.breaks.map((breakItem, index) => (
                            <div key={breakItem.id} className="flex items-center gap-2">
                                <Select value={breakItem.day} onValueChange={(value) => handleBreakChange(index, 'day', value)}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL_DAYS">All Days</SelectItem>
                                        {configDays.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Input type="time" value={breakItem.startTime} onChange={(e) => handleBreakChange(index, 'startTime', e.target.value)}/>
                                <Input type="time" value={breakItem.endTime} onChange={(e) => handleBreakChange(index, 'endTime', e.target.value)}/>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteBreak(breakItem.id)}>
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
                        <Input id="startTime-modal" type="time" value={localConfig.collegeTime.startTime} onChange={(e) => handleCollegeTimeChange('startTime', e.target.value)} />
                    </div>
                    <div className="w-full space-y-1">
                        <Label htmlFor="endTime-modal">End Time</Label>
                        <Input id="endTime-modal" type="time" value={localConfig.collegeTime.endTime} onChange={(e) => handleCollegeTimeChange('endTime', e.target.value)} />
                    </div>
                </CardContent>
            </Card>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancel</Button>
          <Button type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
            Confirm & Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
