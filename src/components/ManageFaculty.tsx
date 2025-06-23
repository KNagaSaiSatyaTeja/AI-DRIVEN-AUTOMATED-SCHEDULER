import { useState, useEffect, useCallback } from "react";
import { TimetableConfig, FacultyConfig } from "@/data/schedule";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {EditFacultyModal} from "./EditFacultyModal.tsx";
import { useApp } from "@/context/AppContext";
import axios from "axios";

interface ManageFacultyProps {
  config: TimetableConfig;
  setConfig: (config: TimetableConfig) => void;
  isAdmin: boolean;
}

export function ManageFaculty({
  config,
  setConfig,
  isAdmin,
}: ManageFacultyProps) {
  const { selectedRoom, setIsLoading } = useApp();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<FacultyConfig | null>(
    null
  );
  const [faculty, setFaculty] = useState<FacultyConfig[]>([]);

  const fetchFaculty = useCallback(async () => {
    if (!selectedRoom) return;
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/faculty/room/${selectedRoom}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setFaculty(response.data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRoom, setIsLoading]);

  useEffect(() => {
    if (selectedRoom) {
      fetchFaculty();
    }
  }, [selectedRoom, fetchFaculty]);

  const handleAddFaculty = () => {
    if (!selectedRoom) {
      toast({
        title: "No room selected",
        variant: "destructive",
      });
      return;
    }
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  const handleEditFaculty = (faculty: FacultyConfig) => {
    if (!selectedRoom) {
      toast({
        title: "No room selected",
        variant: "destructive",
      });
      return;
    }
    setEditingFaculty(faculty);
    setIsModalOpen(true);
  };

  const handleDeleteFaculty = async (facultyId: string) => {
    if (!selectedRoom) return;
    setIsLoading(true);
    try {
      await axios.delete(
        `${
          import.meta.env.VITE_APP_API_BASE_URL
        }/faculty/room/${selectedRoom}/${facultyId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      fetchFaculty();
      toast({
        title: "Faculty Deleted",
        description: `Faculty with ID ${facultyId} has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Cannot Delete Faculty",
        description:
          "This faculty member is assigned to one or more subjects. Please unassign them first.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFaculty = async (faculty: FacultyConfig) => {
    console.log("Saving faculty:", faculty);
    
    if (!selectedRoom) return;
    setIsLoading(true);
    try {
      if (editingFaculty) {
        await axios.put(
          `${
            import.meta.env.VITE_APP_API_BASE_URL
          }/faculty/room/${selectedRoom}/${faculty.id}`,
          {
            ...faculty,
            room: selectedRoom, // ✅ include room
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      } else {
        const response = await axios.post(
          `${
            import.meta.env.VITE_APP_API_BASE_URL
          }/faculty/room/${selectedRoom}`,
          {
            ...faculty,
            room: selectedRoom, // ✅ include room
            id: `f${Date.now()}`,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        faculty.id = response.data.faculty?.id || faculty.id;
      }
      fetchFaculty();
      setIsModalOpen(false);
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manage Faculty</CardTitle>
            <CardDescription>
              Add, edit, or remove faculty members.
            </CardDescription>
          </div>
          {isAdmin && (
            <Button size="sm" onClick={handleAddFaculty}>
              <Plus className="mr-2" /> Add Faculty
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[40%]">Availability</TableHead>
                {isAdmin && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculty.length > 0 ? (
                faculty.map((faculty) => (
                  <TableRow key={faculty.id}>
                    <TableCell className="font-medium">
                      {faculty.name}
                    </TableCell>
                    <TableCell>
                      {faculty.availability &&
                      faculty.availability.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {faculty.availability.map((a, i) => (
                            <span
                              key={i}
                              className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded"
                            >
                              {a.day === "ALL_DAYS" ? "All Days" : a.day}:{" "}
                              {a.startTime} - {a.endTime}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Not specified
                        </span>
                      )}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditFaculty(faculty)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFaculty(faculty.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 3 : 2}
                    className="text-center text-muted-foreground"
                  >
                    No faculty added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <EditFacultyModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        faculty={editingFaculty}
        onSaveSuccess={fetchFaculty}
        onSaveFaculty={handleSaveFaculty}
        selectedRoom={selectedRoom}
      />
    </>
  );
}
