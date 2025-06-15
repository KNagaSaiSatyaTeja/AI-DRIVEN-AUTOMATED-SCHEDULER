
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScheduleEntry } from '@/data/schedule';
import { useForm } from 'react-hook-form';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';

interface EditScheduleModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  scheduleEntry: ScheduleEntry;
}

export function EditScheduleModal({ isOpen, onOpenChange, scheduleEntry }: EditScheduleModalProps) {
    const { toast } = useToast();
    const { updateSchedule, deleteSchedule } = useApp();
    const form = useForm<ScheduleEntry>({
        defaultValues: scheduleEntry,
    });
    
    useEffect(() => {
        form.reset(scheduleEntry);
    }, [scheduleEntry, form]);

    const onSubmit = (data: ScheduleEntry) => {
        updateSchedule(data);
        toast({
            title: "Schedule Updated",
            description: `The changes for ${data.room} have been saved. Note: changes are not persisted on page reload.`,
        });
        onOpenChange(false);
    };
    
    const onDelete = () => {
        deleteSchedule(scheduleEntry);
        toast({
            title: "Schedule Entry Deleted",
            variant: "destructive",
            description: `The entry for ${scheduleEntry.room} has been deleted. Note: changes are not persisted on page reload.`,
        });
        onOpenChange(false);
    };

    const onMarkAsBreak = () => {
        form.reset({
            ...scheduleEntry,
            subject: 'Break',
            faculty: '',
            class: '',
        });
    }

    const isBreak = form.watch('subject') === 'Break';
    const isNewEntry = !scheduleEntry.subject;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNewEntry && !isBreak ? "Add Schedule Entry" : "Edit Schedule"}</DialogTitle>
          <DialogDescription>
            {isNewEntry && !isBreak ? `Add a new entry for ${scheduleEntry.room} at ${scheduleEntry.time} on ${scheduleEntry.day}.` : `Modify the details for this time slot in Room ${scheduleEntry.room}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Day</Label>
                        <Input value={scheduleEntry.day} readOnly disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Time</Label>
                        <Input value={scheduleEntry.time} readOnly disabled />
                    </div>
                </div>
                <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Quantum Physics or Break" {...field} disabled={isBreak} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="faculty"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Faculty</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., Dr. Evelyn Reed" {...field} disabled={isBreak} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Class</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., MSc Physics" {...field} disabled={isBreak} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter className="sm:justify-between pt-4 flex-wrap gap-2">
                    <div className="flex gap-2">
                        <Button type="button" variant="destructive" onClick={onDelete}>Delete</Button>
                        <Button type="button" variant="secondary" onClick={onMarkAsBreak}>Mark as Break</Button>
                    </div>
                    <div className="flex space-x-2">
                         <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
