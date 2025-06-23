
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { SubjectConfig, FacultyConfig } from "@/data/schedule";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/context/AppContext";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required."),
  duration: z.coerce.number().min(1, "Duration must be positive."),
  no_of_classes_per_week: z.coerce
    .number()
    .min(1, "Periods per week must be at least 1."),
  facultyIds: z.array(z.string()).optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

interface EditSubjectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  subject: SubjectConfig | null;
  allFaculty: FacultyConfig[];
  onSaveSuccess: () => void;
}

export function EditSubjectModal({
  isOpen,
  onOpenChange,
  subject,
  allFaculty,
  onSaveSuccess,
}: EditSubjectModalProps) {
  const { selectedRoom, setIsLoading, token } = useApp();
  const { toast } = useToast();
  
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      duration: 50,
      no_of_classes_per_week: 3,
      facultyIds: [],
    },
  });

  useEffect(() => {
    if (subject) {
      form.reset(subject);
    } else {
      form.reset({
        name: "",
        duration: 50,
        no_of_classes_per_week: 3,
        facultyIds: [],
      });
    }
  }, [subject, isOpen, form]);

  const onSubmit = async (data: SubjectFormValues) => {
    if (!selectedRoom || !token) return;
    setIsLoading(true);
    
    try {
      const payload = {
        name: data.name,
        time: data.duration,
        noOfClassesPerWeek: data.no_of_classes_per_week,
        facultyIds: data.facultyIds || [],
        isSpecial: false,
      };

      if (subject) {
        await axios.put(
          `${import.meta.env.VITE_APP_API_BASE_URL}/subject/room/${selectedRoom}/${subject.id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/subject/room/${selectedRoom}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      
      toast({
        title: "Success",
        description: "Subject saved successfully.",
      });
      
      onSaveSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving subject:", error);
      toast({
        title: "Error",
        description: "Failed to save subject. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {subject ? "Edit Subject" : "Add New Subject"}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the subject below.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Quantum Physics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="no_of_classes_per_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. of Periods per Week</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="facultyIds"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Assign Faculty</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Select faculty who can teach this subject.
                      </p>
                    </div>
                    <div className="space-y-2 rounded-md border p-4 max-h-48 overflow-y-auto">
                      {allFaculty.length > 0 ? (
                        allFaculty.map((faculty) => (
                          <FormField
                            key={faculty.id}
                            control={form.control}
                            name="facultyIds"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={faculty.id}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        faculty.id
                                      )}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...(field.value || []),
                                              faculty.id,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== faculty.id
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {faculty.name}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No faculty available. Add faculty in the 'Faculty' tab
                          first.
                        </p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
            Save Subject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
