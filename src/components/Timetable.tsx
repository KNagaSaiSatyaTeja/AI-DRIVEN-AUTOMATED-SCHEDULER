import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Badge } from "@/components/ui/badge";
import { Save, Pencil, Download, RefreshCw } from "lucide-react";

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

// Remove hardcoded time slots - we'll get them from the API response
const API_BASE_URL =
  import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:5000/api";

export function Timetable() {
  const { selectedRoom, role } = useApp();
  const isAdmin = role === "admin";

  const [timetable, setTimetable] = useState<any>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]); // Dynamic time slots
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [form, setForm] = useState({
    subject_name: "",
    faculty_id: "",
    faculty_name: "",
  });
  const [facultyList, setFacultyList] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const parseTimeRange = (slot: string) => {
    const [startTime, endTime] = slot.split("-");
    return { startTime, endTime };
  };

  const loadTimetable = async () => {
    if (!selectedRoom) return;

    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/timetable/room/${selectedRoom}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("Timetable response:", res.data); // Debug log

      setTimetable(res.data);

      // Set time slots from API response, fallback to default if not provided
      if (res.data.timeSlots && res.data.timeSlots.length > 0) {
        setTimeSlots(res.data.timeSlots);
      } else {
        // Fallback: extract time slots from schedule entries
        const uniqueTimeSlots = new Set<string>();
        res.data.schedule?.forEach((entry: any) => {
          if (entry.startTime && entry.endTime) {
            uniqueTimeSlots.add(`${entry.startTime}-${entry.endTime}`);
          }
        });
        setTimeSlots(Array.from(uniqueTimeSlots).sort());
      }
    } catch (error) {
      console.error("Error loading timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadFaculty = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/faculty/room/${selectedRoom}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setFacultyList(res.data);
    } catch (error) {
      console.error("Error loading faculty:", error);
    }
  };

  const loadSubjects = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/subject`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setSubjects(res.data);
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  };

  const openEdit = (day: string, timeSlot: string) => {
    const { startTime, endTime } = parseTimeRange(timeSlot);
    const entry = timetable.schedule.find(
      (e: any) =>
        e.day === day && e.startTime === startTime && e.endTime === endTime
    );

    setEditingSlot({ day, timeSlot, startTime, endTime });
    setForm(entry || { subject_name: "", faculty_id: "", faculty_name: "" });
    setOpen(true);
    loadFaculty();
    loadSubjects();
  };

  const handleSave = async () => {
    if (!timetable || !selectedRoom || !editingSlot) return;

    const { startTime, endTime } = editingSlot;

    const selectedFaculty = facultyList.find(
      (f: any) => f._id === form.faculty_id
    );

    const entry = {
      ...form,
      faculty_name: selectedFaculty?.name || "",
      day: editingSlot.day,
      startTime,
      endTime,
      room_id: selectedRoom,
      is_special: false,
      priority_score: 0,
    };

    // Remove existing entry for this slot
    const updated = timetable.schedule.filter(
      (e: any) =>
        !(
          e.day === editingSlot.day &&
          e.startTime === startTime &&
          e.endTime === endTime
        )
    );

    // Add new entry if both subject and faculty are selected
    if (form.subject_name && form.faculty_id) {
      updated.push(entry);
    }

    // Group by days for the API
    const updatedDays: any = {};
    days.forEach((day) => {
      updatedDays[day] = updated.filter((e: any) => e.day === day);
    });

    try {
      await axios.put(
        `${API_BASE_URL}/timetable/room/${selectedRoom}/${timetable.id}`,
        {
          schedule: updatedDays,
          timeSlots,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update local state
      setTimetable({ ...timetable, schedule: updated, days: updatedDays });
      setOpen(false);

      // Refresh timetable to get latest data
      loadTimetable();
    } catch (error) {
      console.error("Error saving timetable:", error);
    }
  };

  const exportToPDF = () => {
    if (!timetable) return;

    const doc = new jsPDF();
    doc.text(`Room: ${timetable.name} Timetable`, 14, 10);

    const tableBody = days.map((day) => {
      const row = [day];
      timeSlots.forEach((slot) => {
        const { startTime, endTime } = parseTimeRange(slot);
        const match = timetable.schedule.find(
          (e: any) =>
            e.day === day && e.startTime === startTime && e.endTime === endTime
        );
        row.push(match ? `${match.subject_name}\n${match.faculty_name}` : "");
      });
      return row;
    });

    autoTable(doc, {
      startY: 20,
      head: [["Day", ...timeSlots]],
      body: tableBody,
    });

    doc.save(`Timetable_${timetable.name}.pdf`);
  };

  const exportToCSV = () => {
    if (!timetable) return;

    let csv = `Day,${timeSlots.join(",")}\n`;
    days.forEach((day) => {
      const row = [day];
      timeSlots.forEach((slot) => {
        const { startTime, endTime } = parseTimeRange(slot);
        const match = timetable.schedule.find(
          (e: any) =>
            e.day === day && e.startTime === startTime && e.endTime === endTime
        );
        row.push(match ? `${match.subject_name} - ${match.faculty_name}` : "");
      });
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Timetable_${timetable?.name}.csv`;
    link.click();
  };

  // Load timetable when selectedRoom changes
  useEffect(() => {
    if (selectedRoom) {
      loadTimetable();
    }
  }, [selectedRoom]);

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>
          Room Timetable - {timetable?.name || "Loading..."}
          {loading && (
            <span className="text-sm text-muted-foreground ml-2">
              (Loading...)
            </span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            onClick={loadTimetable}
            variant="outline"
            disabled={loading || !selectedRoom}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button onClick={exportToPDF} disabled={!timetable}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={exportToCSV} disabled={!timetable}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!selectedRoom ? (
          <div className="text-center text-muted-foreground py-8">
            Please select a room to view the timetable
          </div>
        ) : !timetable ? (
          <div className="text-center text-muted-foreground py-8">
            {loading
              ? "Loading timetable..."
              : "No timetable found for this room"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Day</TableHead>
                  {timeSlots.map((slot) => (
                    <TableHead key={slot} className="text-center min-w-[120px]">
                      {slot}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {days.map((day) => (
                  <TableRow key={day}>
                    <TableCell className="font-semibold">{day}</TableCell>
                    {timeSlots.map((slot) => {
                      const { startTime, endTime } = parseTimeRange(slot);
                      const match = timetable.schedule?.find(
                        (e: any) =>
                          e.day === day &&
                          e.startTime === startTime &&
                          e.endTime === endTime
                      );

                      return (
                        <TableCell
                          key={`${day}-${slot}`}
                          className={`text-center ${
                            isAdmin ? "cursor-pointer hover:bg-muted" : ""
                          }`}
                          onClick={() => isAdmin && openEdit(day, slot)}
                        >
                          {match ? (
                            <div className="flex flex-col text-sm space-y-1">
                              <span className="font-medium">
                                {match.subject_name}
                              </span>
                              <span className="text-muted-foreground">
                                {match.faculty_name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {timetable.name}
                              </Badge>
                            </div>
                          ) : (
                            isAdmin && (
                              <div className="flex justify-center">
                                <Pencil className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Slot - {editingSlot?.day} ({editingSlot?.timeSlot})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                className="w-full border p-2 rounded mt-1"
                value={form.subject_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, subject_name: e.target.value }))
                }
              >
                <option value="">Select Subject</option>
                {subjects.map((sub: any) => (
                  <option key={sub._id} value={sub.name}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="faculty">Faculty</Label>
              <select
                id="faculty"
                className="w-full border p-2 rounded mt-1"
                value={form.faculty_id}
                onChange={(e) => {
                  const selected = facultyList.find(
                    (f: any) => f._id === e.target.value
                  );
                  if (selected) {
                    setForm((f) => ({
                      ...f,
                      faculty_id: selected._id,
                      faculty_name: selected.name,
                    }));
                  } else {
                    setForm((f) => ({
                      ...f,
                      faculty_id: "",
                      faculty_name: "",
                    }));
                  }
                }}
              >
                <option value="">Select Faculty</option>
                {facultyList
                  .filter((fac: any) => {
                    if (!editingSlot) return true;
                    const { startTime, endTime } = editingSlot;
                    return fac.availability?.some(
                      (a: any) =>
                        (a.day === editingSlot.day || a.day === "ALL_DAYS") &&
                        a.startTime <= startTime &&
                        a.endTime >= endTime
                    );
                  })
                  .map((fac: any) => (
                    <option key={fac._id} value={fac._id}>
                      {fac.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
