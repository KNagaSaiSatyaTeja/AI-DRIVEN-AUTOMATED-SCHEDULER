from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class TimeSlot:
    day: str  # e.g., "MONDAY", "TUESDAY", ..., "SATURDAY"
    startTime: str  # e.g., "09:30" (24-hour format)
    endTime: str  # e.g., "10:20" (24-hour format)

@dataclass
class Break:
    day: str  # "MONDAY", "TUESDAY", ..., "SATURDAY", or "ALL_DAYS" for all weekdays
    startTime: str  # e.g., "11:10" (24-hour format)
    endTime: str  # e.g., "11:20" (24-hour format)

@dataclass
class PreferredSlot:
    day: str  # Specific day or "ANY_DAY"
    startTime: str
    endTime: str
    priority: int = 1  # 1=highest, 5=lowest priority

@dataclass
class Faculty:
    id: str
    name: str
    availability: List[TimeSlot]
    preferred_slots: List[PreferredSlot] = None  # Preferred time slots
    
    def __post_init__(self):
        if self.preferred_slots is None:
            self.preferred_slots = []

@dataclass
class Subject:
    name: str
    time: int  # Duration in minutes (e.g., 50)
    no_of_classes_per_week: int  # Number of classes required per week
    faculty: List[Faculty]
    duration: int = None  # Optional, for backward compatibility
    is_special: bool = False  # Mark as special class (lab, practical, etc.)
    preferred_slots: List[PreferredSlot] = None  # Subject-specific preferred slots
    requires_consecutive: bool = False  # For labs that need consecutive periods
    
    def __post_init__(self):
        if self.duration is None:
            self.duration = self.time
        if not hasattr(self, 'time') or self.time is None:
            self.time = self.duration
        if not hasattr(self, 'no_of_classes_per_week'):
            self.no_of_classes_per_week = 1
        if self.preferred_slots is None:
            self.preferred_slots = []

@dataclass
class CollegeTime:
    startTime: str  # e.g., "09:30" (24-hour format)
    endTime: str  # e.g., "14:50" (24-hour format)

@dataclass
class ScheduleAssignment:
    subject_name: str
    faculty_id: str
    faculty_name: str  # Added for frontend display
    day: str
    startTime: str
    endTime: str
    room_id: str
    is_special: bool = False
    priority_score: int = 0  # Higher score = better preference match

    def model_dump(self) -> Dict[str, Any]:
        """Return all fields as a dictionary for compatibility with SchedulerService."""
        return {
            "subject_name": self.subject_name,
            "faculty_id": self.faculty_id,
            "faculty_name": self.faculty_name,
            "day": self.day,
            "startTime": self.startTime,
            "endTime": self.endTime,
            "room_id": self.room_id,
            "is_special": self.is_special,
            "priority_score": self.priority_score
        }

@dataclass
class ScheduleInput:
    subjects: List[Subject]
    break_: List[Break]
    college_time: CollegeTime
    rooms: List[str]
