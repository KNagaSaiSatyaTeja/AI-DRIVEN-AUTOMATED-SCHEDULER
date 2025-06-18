
import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FacultyConfig, configDays, FacultyAvailability } from '@/data/schedule';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';

const availabilitySchema = z.object({
  day: z.enum(configDays),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
}).refine(data => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
});

const facultySchema = z.object({
  name: z.string().min(1, 'Faculty name is required.'),
  availability: z.array(availabilitySchema).optional(),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

interface EditFacultyModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  faculty: FacultyConfig | null;
  onSave: (faculty: FacultyConfig) => void;
}

export function EditFacultyModal({ isOpen, onOpenChange, faculty, onSave }: EditFacultyModalProps) {
  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: '',
      availability: [],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "availability"
  });

  useEffect(() => {
    if (faculty) {
      form.reset({
        name: faculty.name,
        availability: faculty.availability ? faculty.availability.map(a => ({...a})) : [],
      });
    } else {
      form.reset({ name: '', availability: [] });
    }
  }, [faculty, isOpen, form]);

  const onSubmit = (data: FacultyFormValues) => {
    onSave({
      id: faculty?.id || '', // id set by parent
      name: data.name,
      availability: (data.availability || []) as FacultyAvailability[],
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{faculty ? 'Edit Faculty' : 'Add New Faculty'}</DialogTitle>
          <DialogDescription>Fill in the details for the faculty member.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-4 pr-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Dr. Evelyn Reed" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                
                <div>
                  <FormLabel>Availability</FormLabel>
                  <div className="p-4 mt-2 space-y-4 border rounded-md">
                    {fields.length > 0 ? fields.map((item, index) => (
                      <div key={item.id} className="flex items-end gap-2 p-2 -mx-2 border-b">
                        <FormField
                          control={form.control}
                          name={`availability.${index}.day`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs">Day</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {configDays.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`availability.${index}.startTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Start Time</FormLabel>
                              <FormControl><Input type="time" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`availability.${index}.endTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">End Time</FormLabel>
                              <FormControl><Input type="time" {...field} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )) : <p className="text-sm text-center text-muted-foreground">No availability slots added.</p>}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => append({ day: 'MONDAY', startTime: '09:00', endTime: '17:00' })}
                    >
                      <Plus className="mr-2" />
                      Add Availability
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Faculty</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
