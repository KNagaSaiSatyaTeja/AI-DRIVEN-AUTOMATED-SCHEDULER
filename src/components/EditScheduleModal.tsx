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
import { ScheduleEntry, days } from '@/data/schedule';
import { useForm } from 'react-hook-form';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    const { updateSchedule, deleteSchedule, schedule, timeSlots } = useApp();
    const form = useForm<ScheduleEntry>({
        defaultValues: scheduleEntry,
    });
    
    useEffect(() => {
        form.reset(scheduleEntry);
    }, [scheduleEntry, form, isOpen]);

    const isSlotEditable = !scheduleEntry.day && !scheduleEntry.time;
    // An entry is new if it doesn't have a faculty or class yet. This covers new sessions and new breaks.
    const isNewEntry = !scheduleEntry.faculty && !scheduleEntry.class;

    const onSubmit = (data: ScheduleEntry) => {
        if (isNewEntry) {
            const isClash = schedule.some(
                (e) => e.day === data.day && e.time === data.time && e.room === data.room
            );
            if (isClash) {
                toast({
                    title: "Time Slot Clash",
                    description: `The time slot ${data.time} on ${data.day} in room ${data.room} is already occupied.`,
                    variant: "destructive",
                });
                return;
            }
        }

        updateSchedule(data);
        toast({
            title: isNewEntry ? "Schedule Entry Added" : "Schedule Updated",
            description: `The changes for ${data.room} have been saved.`,
        });
        onOpenChange(false);
    };
    
    const onDelete = () => {
        // We can only delete an entry that actually exists
        if (!isNewEntry) {
            deleteSchedule(scheduleEntry);
            toast({
                title: "Schedule Entry Deleted",
                variant: "destructive",
                description: `The entry for ${scheduleEntry.room} has been deleted.`,
            });
        }
        onOpenChange(false);
    };

    const onMarkAsBreak = () => {
        const currentValues = form.getValues();
        form.reset({
            room: scheduleEntry.room,
            day: isSlotEditable ? currentValues.day : scheduleEntry.day,
            time: isSlotEditable ? currentValues.time : scheduleEntry.time,
            subject: 'Break',
            faculty: '',
            class: '',
        });
    }

    const isBreak = form.watch('subject') === 'Break';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isSlotEditable ? "Add New Schedule Entry" : "Edit Schedule Entry"}</DialogTitle>
          <DialogDescription>
            {isSlotEditable 
                ? `Add a new entry for Room ${scheduleEntry.room}. Select a slot and fill in the details.` 
                : `Modify the details for this time slot in Room ${scheduleEntry.room}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {isSlotEditable ? (
                        <>
                            <FormField
                                control={form.control}
                                name="day"
                                rules={{ required: "Day is required." }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Day</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a day" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {days.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="time"
                                rules={{ required: "Time is required." }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a time slot" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {timeSlots.sort().map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label>Day</Label>
                                <Input value={scheduleEntry.day} readOnly disabled />
                            </div>
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input value={scheduleEntry.time} readOnly disabled />
                            </div>
                        </>
                    )}
                </div>
                <FormField
                    control={form.control}
                    name="subject"
                    rules={{ required: "Subject is required." }}
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
                        <Button type="button" variant="destructive" onClick={onDelete} disabled={isNewEntry}>Delete</Button>
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
