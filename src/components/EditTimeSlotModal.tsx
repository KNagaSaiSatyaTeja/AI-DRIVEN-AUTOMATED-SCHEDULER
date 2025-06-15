
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

interface EditTimeSlotModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  timeSlot: string | null;
}

interface TimeSlotFormValues {
    startTime: string;
    endTime: string;
}

export function EditTimeSlotModal({ isOpen, onOpenChange, timeSlot }: EditTimeSlotModalProps) {
    const { toast } = useToast();
    const { addTimeSlot, updateTimeSlot, timeSlots } = useApp();
    
    const isNew = timeSlot === null;

    const form = useForm<TimeSlotFormValues>({
        defaultValues: {
            startTime: '',
            endTime: ''
        },
    });
    
    useEffect(() => {
        if (timeSlot) {
            const [startTime, endTime] = timeSlot.split(' - ');
            form.reset({ startTime, endTime });
        } else {
            form.reset({ startTime: '', endTime: '' });
        }
    }, [timeSlot, form, isOpen]);

    const onSubmit = (data: TimeSlotFormValues) => {
        const newTimeSlot = `${data.startTime} - ${data.endTime}`;

        if (timeSlots.includes(newTimeSlot) && newTimeSlot !== timeSlot) {
            form.setError("startTime", { type: "manual", message: "This time slot already exists." });
            return;
        }

        if (isNew) {
            addTimeSlot(newTimeSlot);
            toast({
                title: "Time Slot Added",
                description: `The time slot ${newTimeSlot} has been added.`,
            });
        } else if(timeSlot) {
            updateTimeSlot(timeSlot, newTimeSlot);
            toast({
                title: "Time Slot Updated",
                description: `The time slot has been updated to ${newTimeSlot}.`,
            });
        }
        onOpenChange(false);
    };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isNew ? "Add New Time Slot" : "Edit Time Slot"}</DialogTitle>
          <DialogDescription>
            Enter start and end times. Use HH:MM format (e.g., 09:00).
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startTime"
                        rules={{ required: "Start time is required", pattern: { value: /^\d{2}:\d{2}$/, message: "Invalid format. Use HH:MM" } }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 09:00" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="endTime"
                        rules={{ required: "End time is required", pattern: { value: /^\d{2}:\d{2}$/, message: "Invalid format. Use HH:MM" } }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., 10:30" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
