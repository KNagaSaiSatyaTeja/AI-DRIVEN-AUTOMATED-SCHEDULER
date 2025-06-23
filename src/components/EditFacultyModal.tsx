import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FacultyConfig,
  configDays,
  FacultyAvailability,
} from "@/data/schedule";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";

import { useToast } from "@/components/ui/use-toast";

const availabilitySchema = z
  .object({
    day: z.enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "ALL_DAYS",
    ]),
    startTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)"
      ),
    endTime: z
      .string()
      .regex(
        /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
        "Invalid time format (HH:MM)"
      ),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

const facultySchema = z.object({
  name: z.string().min(1, "Faculty name is required."),
  availability: z.array(availabilitySchema).optional(),
});

type FacultyFormValues = z.infer<typeof facultySchema>;

interface EditFacultyModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  faculty: FacultyConfig | null;
  onSaveSuccess: () => void;
  onSaveFaculty: (data: FacultyFormValues) => Promise<void>;
  selectedRoom: string;
}

export function EditFacultyModal({
  isOpen,
  onOpenChange,
  faculty,
  onSaveSuccess,
  onSaveFaculty,
  selectedRoom,
}: EditFacultyModalProps) {
  const { setIsLoading } = useApp(); // ✅ Fix
  const { toast } = useToast();
  
  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      name: "",
      availability: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "availability",
  });

  useEffect(() => {
    if (faculty) {
      form.reset({
        name: faculty.name,
        availability: faculty.availability
          ? faculty.availability.map((a) => ({ ...a }))
          : [],
      });
    } else {
      form.reset({ name: "", availability: [] });
    }
    console.log("Form reset with:", { faculty, selectedRoom }); // Debug reset
  }, [faculty, isOpen, form]);

  const onSubmit = async (data: FacultyFormValues) => {
    if (!selectedRoom) {
      console.error("No selected room available");
      return;
    }

    setIsLoading(true);
    console.log("Form submitted with data:", data); // Debug submission

    try {
      // Send to parent to handle API and update list
      await onSaveFaculty({
        name: data.name,
        availability: data.availability || [],
      });

      toast({
        title: "Success",
        description: "Faculty saved successfully.",
      });

      onSaveSuccess(); // refetch list
      onOpenChange(false); // close modal
    } catch (error) {
      console.error("Error saving faculty:", error);
      toast({
        title: "Error",
        description: "Failed to save faculty. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Debug: Log when handleSubmit is called
  const handleSubmitWrapper = form.handleSubmit((data) => {
    console.log("handleSubmit called with data:", data);
    onSubmit(data);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {faculty ? "Edit Faculty" : "Add New Faculty"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the faculty member.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <Form {...form}>
              <form
                id="faculty-form"
                onSubmit={handleSubmitWrapper} // Use wrapper for debugging
                className="space-y-4 pb-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculty Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Dr. Evelyn Reed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Availability</FormLabel>
                  <div className="p-4 mt-2 space-y-4 border rounded-md">
                    {fields.length > 0 ? (
                      fields.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-end gap-2 p-2 border-b last:border-b-0"
                        >
                          <FormField
                            control={form.control}
                            name={`availability.${index}.day`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-xs">Day</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select day" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ALL_DAYS">
                                      All Days
                                    </SelectItem>
                                    {configDays
                                      .filter((day) => day !== "ALL_DAYS")
                                      .map((day) => (
                                        <SelectItem key={day} value={day}>
                                          {day}
                                        </SelectItem>
                                      ))}
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
                                <FormLabel className="text-xs">
                                  Start Time
                                </FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`availability.${index}.endTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  End Time
                                </FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-center text-muted-foreground">
                        No availability slots added.
                      </p>
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-4"
                      onClick={() =>
                        append({
                          day: "ALL_DAYS",
                          startTime: "09:00",
                          endTime: "17:00",
                        })
                      }
                    >
                      <Plus className="mr-2 w-4 h-4" />
                      Add Availability
                    </Button>
                  </div>
                </div>

                {/* Debug: Display form errors */}
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="text-red-500 text-sm">
                    {JSON.stringify(form.formState.errors, null, 2)}
                  </div>
                )}
              </form>
            </Form>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="faculty-form">
            Save Faculty
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
