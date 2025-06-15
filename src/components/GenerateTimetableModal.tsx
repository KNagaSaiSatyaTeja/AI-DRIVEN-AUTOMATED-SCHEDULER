
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TimetableConfig } from '@/data/schedule';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface GenerateTimetableModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  config: TimetableConfig;
  onConfirmGenerate: () => void;
}

export function GenerateTimetableModal({ isOpen, onOpenChange, config, onConfirmGenerate }: GenerateTimetableModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate New Timetable</DialogTitle>
          <DialogDescription>
            Review the configuration below. A new timetable will be generated for all rooms based on these settings. This will replace the current schedule.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Card>
                <CardHeader className="p-4">
                    <CardTitle className="text-lg">Configuration Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm space-y-2">
                    <div className="flex justify-between items-center"><span>Rooms</span> <Badge variant="secondary">{config.rooms.length}</Badge></div>
                    <div className="flex justify-between items-center"><span>Subjects</span> <Badge variant="secondary">{config.subjects.length}</Badge></div>
                    <div className="flex justify-between items-center"><span>Faculty</span> <Badge variant="secondary">{config.faculty.length}</Badge></div>
                    <div className="flex justify-between items-center"><span>Breaks</span> <Badge variant="secondary">{config.breaks.length}</Badge></div>
                    <div className="flex justify-between items-center"><span>College Timing</span> <Badge variant="secondary">{config.collegeTime.startTime} - {config.collegeTime.endTime}</Badge></div>
                </CardContent>
            </Card>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={onConfirmGenerate}>Confirm & Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
