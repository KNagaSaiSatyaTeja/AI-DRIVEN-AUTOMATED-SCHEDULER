import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Save,
  X,
  Trash2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import axios, { AxiosRequestConfig } from "axios";

interface ScheduleEntry {
  subject_name: string;
  faculty_name: string;
  faculty_id: string;
  room_id: string;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  is_special?: boolean;
  priority_score?: number;
  _id?: string;
}

interface TimetableData {
  id?: string;
  roomId?: string;
  timeSlots: string[];
  schedule: ScheduleEntry[];
  days: {
    [key: string]: ScheduleEntry[];
  };
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function Timetable() {
  const [timetable, setTimetable] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    subject_name: "",
    faculty_name: "",
    faculty_id: "",
    room_id: "",
  });
  const { selectedRoom, setSelectedRoom, role } = useApp();

  // Environment configuration
  const API_BASE_URL =
    import.meta.env.VITE_APP_API_BASE_URL || "http://localhost:5000/api";
  const isAdmin = role === "admin";

  const days = [
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  // Enhanced API helper function for all HTTP methods with axios
  const apiCall = async (
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      data?: unknown;
      params?: unknown;
      headers?: Record<string, string>;
    } = {}
  ) => {
    const token = localStorage.getItem("token");

    const config: AxiosRequestConfig = {
      url: `${API_BASE_URL}${endpoint}`,
      method: options.method || "GET",
      headers: {
        Authorization: "Bearer " + token,
      },
      ...(options.data && { data: options.data }),
      ...(options.params && { params: options.params }),
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          `HTTP ${error.response?.status || "Error"}`;
        throw new Error(errorMessage);
      }
      throw new Error("Network error occurred");
    }
  };

  // Convert schedule array to days object structure
  const convertScheduleToDays = (schedule: ScheduleEntry[]) => {
    const daysData: { [key: string]: ScheduleEntry[] } = {};

    days.forEach((day) => {
      daysData[day] = schedule.filter((entry) => entry.day === day);
    });

    return daysData;
  };

  // Convert days object back to schedule array
  const convertDaysToSchedule = (daysData: {
    [key: string]: ScheduleEntry[];
  }) => {
    const schedule: ScheduleEntry[] = [];

    Object.keys(daysData).forEach((day) => {
      schedule.push(...daysData[day]);
    });

    return schedule;
  };

  // Generate time slots from schedule data
  const generateTimeSlots = (schedule: ScheduleEntry[]) => {
    const slots = new Set<string>();

    schedule.forEach((entry) => {
      slots.add(`${entry.startTime}-${entry.endTime}`);
    });

    // Sort time slots
    return Array.from(slots).sort((a, b) => {
      const [startA] = a.split("-");
      const [startB] = b.split("-");
      return startA.localeCompare(startB);
    });
  };

  // Load timetable data
  const loadTimetable = async () => {
    if (!selectedRoom) {
      setError("Please select a room to view timetable");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiCall(`/timetable/room/${selectedRoom}`);

      const schedule = data.schedule || [];
      const timeSlots = data.timeSlots || generateTimeSlots(schedule);
      const daysData = convertScheduleToDays(schedule);

      setTimetable({
        id: data.id,
        roomId: data.roomId,
        name: data.name,
        timeSlots: timeSlots,
        schedule: schedule,
        days: daysData,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    } catch (err) {
      console.error("Error loading timetable:", err);
      setError(err instanceof Error ? err.message : "Failed to load timetable");

      // Initialize with empty timetable if none exists
      const defaultTimeSlots = [
        "09:00-09:50",
        "09:50-10:40",
        "10:40-11:30",
        "11:30-12:20",
        "14:00-14:50",
        "14:50-15:40",
        "15:40-16:30",
      ];

      setTimetable({
        timeSlots: defaultTimeSlots,
        schedule: [],
        days: days.reduce((acc, day) => ({ ...acc, [day]: [] }), {}),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      loadTimetable();
    }
  }, [selectedRoom]);

  const parseTimeRange = (timeRange: string) => {
    const [startTime, endTime] = timeRange.split("-");
    return { startTime, endTime };
  };

  const handleEditStart = (day: string, timeSlot: string) => {
    if (!isAdmin || !timetable) return;

    const cellKey = `${day}-${timeSlot}`;
    setEditingCell(cellKey);

    const { startTime, endTime } = parseTimeRange(timeSlot);
    const entry = timetable.days[day]?.find(
      (s) => s.startTime === startTime && s.endTime === endTime
    );

    if (entry) {
      setEditForm({
        subject_name: entry.subject_name,
        faculty_name: entry.faculty_name,
        faculty_id: entry.faculty_id,
        room_id: entry.room_id,
      });
    } else {
      setEditForm({
        subject_name: "",
        faculty_name: "",
        faculty_id: "",
        room_id: selectedRoom || "",
      });
    }
  };

  const handleSave = async (day: string, timeSlot: string) => {
    if (!timetable || !selectedRoom) return;

    const { startTime, endTime } = parseTimeRange(timeSlot);

    try {
      setLoading(true);

      const newEntry: ScheduleEntry = {
        subject_name: editForm.subject_name,
        faculty_name: editForm.faculty_name,
        faculty_id: editForm.faculty_id,
        room_id: editForm.room_id,
        day,
        name: timetable?.name,
        startTime,
        endTime,
        is_special: false,
        priority_score: 0,
      };

      // Update local state optimistically
      const updatedDays = { ...timetable.days };

      // Remove existing entry at this time slot
      updatedDays[day] =
        updatedDays[day]?.filter(
          (s) => !(s.startTime === startTime && s.endTime === endTime)
        ) || [];

      // Add new entry if form is not empty
      if (editForm.subject_name.trim()) {
        updatedDays[day].push(newEntry);
      }

      const updatedSchedule = convertDaysToSchedule(updatedDays);
      const updatedTimetable = {
        ...timetable,
        days: updatedDays,
        schedule: updatedSchedule,
        updatedAt: new Date().toISOString(),
      };

      setTimetable(updatedTimetable);

      // Save to API
      if (timetable.id) {
        await apiCall(`/timetable/room/${selectedRoom}/${timetable.id}`, {
          method: "PUT",
          data: {
            schedule: updatedSchedule,
            timeSlots: timetable.timeSlots,
          },
        });
      } else {
        // Create new timetable
        await apiCall(`/timetable/room/${selectedRoom}`, {
          method: "POST",
          data: {
            schedule: updatedSchedule,
            timeSlots: timetable.timeSlots,
            roomId: selectedRoom,
          },
        });
      }

      setEditingCell(null);
      setEditForm({
        subject_name: "",
        faculty_name: "",
        faculty_id: "",
        room_id: "",
      });
    } catch (err) {
      console.error("Error saving entry:", err);
      setError(err instanceof Error ? err.message : "Failed to save entry");
      // Reload timetable on error to ensure consistency
      loadTimetable();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (day: string, timeSlot: string) => {
    if (!timetable || !selectedRoom) return;

    const { startTime, endTime } = parseTimeRange(timeSlot);

    try {
      setLoading(true);

      // Update local state
      const updatedDays = { ...timetable.days };
      updatedDays[day] =
        updatedDays[day]?.filter(
          (s) => !(s.startTime === startTime && s.endTime === endTime)
        ) || [];

      const updatedSchedule = convertDaysToSchedule(updatedDays);
      const updatedTimetable = {
        ...timetable,
        days: updatedDays,
        schedule: updatedSchedule,
        updatedAt: new Date().toISOString(),
      };

      setTimetable(updatedTimetable);

      // Update via API if timetable exists
      if (timetable.id) {
        await apiCall(`/timetable/room/${selectedRoom}/${timetable.id}`, {
          method: "PUT",
          data: {
            schedule: updatedSchedule,
            timeSlots: timetable.timeSlots,
          },
        });
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
      setError(err instanceof Error ? err.message : "Failed to delete entry");
      loadTimetable();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditForm({
      subject_name: "",
      faculty_name: "",
      faculty_id: "",
      room_id: "",
    });
  };

  const handleRefresh = () => {
    loadTimetable();
  };

  const cn = (...classes: (string | undefined | boolean)[]) => {
    return classes.filter(Boolean).join(" ");
  };

  if (loading && !timetable) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600">Loading timetable...</span>
        </div>
      </div>
    );
  }

  if (!selectedRoom) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Room
          </h3>
          <p className="text-gray-500">
            Please select a room to view its timetable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Card Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Weekly Timetable - Room {timetable?.name}
            </h3>
            {timetable?.updatedAt && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {new Date(timetable.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-gray-200">
                <th className="w-32 px-4 py-3 text-left text-sm font-medium text-gray-500 bg-gray-50">
                  Day
                </th>
                {(timetable?.timeSlots || []).map((timeSlot) => (
                  <th
                    key={timeSlot}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 bg-gray-50 min-w-[180px]"
                  >
                    {timeSlot}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200">
              {days.map((day) => (
                <tr key={day} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-600">
                    {day.charAt(0) + day.slice(1).toLowerCase()}
                  </td>
                  {(timetable?.timeSlots || []).map((timeSlot) => {
                    const { startTime, endTime } = parseTimeRange(timeSlot);
                    const entries =
                      timetable?.days[day]?.filter(
                        (s) =>
                          s.startTime === startTime && s.endTime === endTime
                      ) || [];
                    const cellKey = `${day}-${timeSlot}`;
                    const isEditing = editingCell === cellKey;

                    if (isEditing) {
                      return (
                        <td key={timeSlot} className="px-4 py-4">
                          <div className="space-y-2 min-w-[180px]">
                            <input
                              type="text"
                              placeholder="Subject"
                              value={editForm.subject_name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  subject_name: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Faculty Name"
                              value={editForm.faculty_name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  faculty_name: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Faculty ID"
                              value={editForm.faculty_id}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  faculty_id: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Room ID"
                              value={timetable?.name}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(day, timeSlot)}
                                disabled={loading}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancel}
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    if (entries.length === 0) {
                      return (
                        <td
                          key={timeSlot}
                          className={cn(
                            "px-4 py-4 text-center",
                            isAdmin &&
                              !loading &&
                              "cursor-pointer hover:bg-blue-50"
                          )}
                          onClick={() =>
                            isAdmin &&
                            !loading &&
                            handleEditStart(day, timeSlot)
                          }
                        >
                          {isAdmin && !loading && (
                            <button className="inline-flex items-center justify-center h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      );
                    }

                    if (entries.length > 1) {
                      return (
                        <td
                          key={timeSlot}
                          className={cn(
                            "px-4 py-4",
                            isAdmin &&
                              !loading &&
                              "cursor-pointer hover:bg-blue-50"
                          )}
                          onClick={() =>
                            isAdmin &&
                            !loading &&
                            handleEditStart(day, timeSlot)
                          }
                        >
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Clash ({entries.length})
                          </span>
                        </td>
                      );
                    }

                    const entry = entries[0];

                    return (
                      <td
                        key={timeSlot}
                        className={cn(
                          "px-4 py-4 relative group",
                          isAdmin &&
                            entry &&
                            !loading &&
                            "cursor-pointer hover:bg-blue-50"
                        )}
                        onClick={() =>
                          isAdmin && !loading && handleEditStart(day, timeSlot)
                        }
                      >
                        {entry ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">
                                  {entry.subject_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {entry.faculty_name}
                                </p>
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 mt-1">
                                  {timetable?.name}
                                </span>
                              </div>
                              {isAdmin && !loading && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditStart(day, timeSlot);
                                    }}
                                    className="inline-flex items-center justify-center h-6 w-6 text-blue-600 hover:bg-blue-100 rounded"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(day, timeSlot);
                                    }}
                                    className="inline-flex items-center justify-center h-6 w-6 text-red-600 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
