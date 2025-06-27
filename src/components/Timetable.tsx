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
import { Save, Pencil, Download } from "lucide-react";

const days = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const timeSlots = [
  "09:00-09:50",
  "09:50-10:40",
  "10:40-11:30",
  "11:30-12:20",
  "14:00-14:50",
  "14:50-15:40",
  "15:40-16:30",
];
const API_BASE_URL =
  import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:5000/api";

export function Timetable() {
  const { selectedRoom, role } = useApp();
  const isAdmin = role === "admin";

  const [timetable, setTimetable] = useState<any>(null);
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
    const res = await axios.get(
      `${API_BASE_URL}/timetable/room/${selectedRoom}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    setTimetable(res.data);
  };

  const loadFaculty = async () => {
    const res = await axios.get(
      `${API_BASE_URL}/faculty/room/${selectedRoom}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    setFacultyList(res.data);
  };

  const loadSubjects = async () => {
    const res = await axios.get(`${API_BASE_URL}/subject`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    setSubjects(res.data);
  };

  const openEdit = (day: string, timeSlot: string) => {
    const entry = timetable.schedule.find(
      (e) => e.day === day && `${e.startTime}-${e.endTime}` === timeSlot
    );
    setEditingSlot({ day, timeSlot });
    setForm(entry || { subject_name: "", faculty_id: "", faculty_name: "" });
    setOpen(true);
    loadFaculty();
    loadSubjects();
  };

  const handleSave = async () => {
    if (!timetable || !selectedRoom || !editingSlot) return;
    const { startTime, endTime } = parseTimeRange(editingSlot.timeSlot);

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

    const updated = timetable.schedule.filter(
      (e: any) =>
        !(
          e.day === editingSlot.day &&
          e.startTime === startTime &&
          e.endTime === endTime
        )
    );
    if (form.subject_name && form.faculty_id) updated.push(entry);

    const updatedDays: any = {};
    days.forEach((day) => {
      updatedDays[day] = updated.filter((e: any) => e.day === day);
    });

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

    setTimetable({ ...timetable, schedule: updated, days: updatedDays });
    setOpen(false);
  };

  const exportToPDF = () => {
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

  useEffect(() => {
    if (selectedRoom) loadTimetable();
  }, [selectedRoom]);

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Room Timetable - {timetable?.name}</CardTitle>
        <div className="flex gap-2">
          <Button onClick={exportToPDF}>
            <Download className="w-4 h-4 mr-2" /> PDF
          </Button>
          <Button onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" /> CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                {timeSlots.map((slot) => (
                  <TableHead key={slot}>{slot}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map((day) => (
                <TableRow key={day}>
                  <TableCell className="font-semibold">{day}</TableCell>
                  {timeSlots.map((slot) => {
                    const { startTime, endTime } = parseTimeRange(slot);
                    const match = timetable?.schedule?.find(
                      (e: any) =>
                        e.day === day &&
                        e.startTime === startTime &&
                        e.endTime === endTime
                    );

                    return (
                      <TableCell
                        key={slot}
                        className={
                          isAdmin ? "cursor-pointer hover:bg-muted" : ""
                        }
                        onClick={() => isAdmin && openEdit(day, slot)}
                      >
                        {match ? (
                          <div className="flex flex-col text-sm">
                            <span className="font-medium">
                              {match.subject_name}
                            </span>
                            <span className="text-muted-foreground">
                              {match.faculty_name}
                            </span>
                            <Badge variant="outline">{timetable?.name}</Badge>
                          </div>
                        ) : (
                          isAdmin && (
                            <Pencil className="w-4 h-4 text-muted-foreground" />
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
      </CardContent>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <select
                className="w-full border p-2 rounded"
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
              <Label>Faculty</Label>
              <select
                className="w-full border p-2 rounded"
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
                  }
                }}
              >
                <option value="">Select Faculty</option>
                {facultyList
                  .filter((fac: any) => {
                    if (!editingSlot) return true;
                    const { day, timeSlot } = editingSlot;
                    const { startTime, endTime } = parseTimeRange(timeSlot);
                    return fac.availability?.some(
                      (a: any) =>
                        (a.day === day || a.day === "ALL_DAYS") &&
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
            <div className="flex justify-end">
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
