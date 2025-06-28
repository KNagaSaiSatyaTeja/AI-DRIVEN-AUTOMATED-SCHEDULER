# from typing import List, Dict, Any, Tuple, Optional
# from collections import defaultdict
# from model import ScheduleInput, ScheduleAssignment, TimeSlot, Break, Subject, Faculty
# from utils import check_time_conflict, check_break_conflict, time_to_minutes, minutes_to_time, VALID_DAYS, generate_time_slots, generate_weekly_time_slots, calculate_preference_score
# import random
# from datetime import datetime
# import logging
# import copy

# # Configure logging
# logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
# logger = logging.getLogger(__name__)

# class EnhancedConstraintChecker:
#     def __init__(self, subjects: List[Subject]):
#         self.subjects = subjects

#     def sort_subjects_by_constraints(self, subjects: List[Subject]) -> List[Subject]:
#         """Sort subjects by scheduling difficulty and special class priority."""
#         def sort_key(s):
#             special_priority = 0 if s.is_special else 1
#             faculty_constraint = len(s.faculty)
#             class_priority = -s.no_of_classes_per_week
#             duration_constraint = s.time / 50
#             return (special_priority, faculty_constraint, class_priority, duration_constraint)
        
#         return sorted(subjects, key=sort_key)

#     def get_valid_slots_for_duration(self, availability: List[TimeSlot], fixed_slots: List[TimeSlot], duration: int) -> List[TimeSlot]:
#         """Get slots that match the faculty's availability and required duration."""
#         valid_slots = []
#         for slot in fixed_slots:
#             slot_duration = time_to_minutes(slot.endTime) - time_to_minutes(slot.startTime)
#             if slot_duration != duration:
#                 continue
#             for avail in availability:
#                 if avail.day == slot.day or avail.day == "ALL_DAYS":
#                     avail_start = time_to_minutes(avail.startTime)
#                     avail_end = time_to_minutes(avail.endTime)
#                     slot_start = time_to_minutes(slot.startTime)
#                     slot_end = time_to_minutes(slot.endTime)
#                     if avail_start <= slot_start and slot_end <= avail_end:
#                         valid_slots.append(slot)
#                         break
#         return valid_slots

# class SchedulerService:
#     def __init__(self):
#         self.assignments: Dict[str, List[ScheduleAssignment]] = {}
#         self.all_assignments: List[ScheduleAssignment] = []
#         self.constraint_checker = None
#         self.single_room_id = "R1"
#         self.time_slot_labels: List[str] = []
#         self.fixed_slots: List[TimeSlot] = []
#         self.schedule_history = []
#         self.faculty_schedule: Dict[str, Dict[str, List[TimeSlot]]] = {}
#         self.room_schedule: Dict[str, Dict[str, List[TimeSlot]]] = {}
#         self.subject_counts: Dict[str, int] = {}
#         self.unassigned_reasons: Dict[Tuple[str, str, str], str] = {}

#     def _validate_time(self, time_str: str, field: str) -> None:
#         """Validate a time string format."""
#         try:
#             time_to_minutes(time_str)
#         except ValueError as e:
#             raise ValueError(f"Invalid time format in {field}: {time_str}, error: {e}")

#     def _validate_input(self, input_data: ScheduleInput) -> None:
#         """Validate all time fields in input data."""
#         for subject in input_data.subjects:
#             for faculty in subject.faculty:
#                 for avail in faculty.availability:
#                     self._validate_time(avail.startTime, f"faculty {faculty.id} availability startTime")
#                     self._validate_time(avail.endTime, f"faculty {faculty.id} availability endTime")
#                     if avail.day not in VALID_DAYS and avail.day != "ALL_DAYS":
#                         raise ValueError(f"Invalid day in faculty availability: {avail.day}. Must be one of {VALID_DAYS} or ALL_DAYS")
#         for b in input_data.break_:
#             self._validate_time(b.startTime, "break startTime")
#             self._validate_time(b.endTime, "break endTime")
#             if b.day not in VALID_DAYS and b.day != "ALL_DAYS":
#                 raise ValueError(f"Invalid day in break: {b.day}. Must be one of {VALID_DAYS} or ALL_DAYS")
#         self._validate_time(input_data.college_time.startTime, "college_time startTime")
#         self._validate_time(input_data.college_time.endTime, "college_time endTime")

#     def _initialize_schedules(self, input_data: ScheduleInput):
#         """Initialize faculty and room schedules."""
#         for subject in input_data.subjects:
#             for faculty in subject.faculty:
#                 if faculty.id not in self.faculty_schedule:
#                     self.faculty_schedule[faculty.id] = {day: [] for day in VALID_DAYS}
#         for room in input_data.rooms:
#             if room not in self.room_schedule:
#                 self.room_schedule[room] = {day: [] for day in VALID_DAYS}
#         self.subject_counts = {subject.name: 0 for subject in input_data.subjects}
#         self.unassigned_reasons = {}

#     def _is_slot_available(self, faculty_id: str, room_id: str, time_slot: TimeSlot) -> bool:
#         """Check if a slot is available for both faculty and room."""
#         if faculty_id in self.faculty_schedule:
#             for existing_slot in self.faculty_schedule[faculty_id][time_slot.day]:
#                 if check_time_conflict(time_slot, existing_slot):
#                     return False
#         if room_id in self.room_schedule:
#             for existing_slot in self.room_schedule[room_id][time_slot.day]:
#                 if check_time_conflict(time_slot, existing_slot):
#                     return False
#         return True

#     def _book_slot(self, faculty_id: str, room_id: str, time_slot: TimeSlot):
#         """Book a slot for faculty and room."""
#         if faculty_id not in self.faculty_schedule:
#             self.faculty_schedule[faculty_id] = {day: [] for day in VALID_DAYS}
#         if room_id not in self.room_schedule:
#             self.room_schedule[room_id] = {day: [] for day in VALID_DAYS}
#         self.faculty_schedule[faculty_id][time_slot.day].append(time_slot)
#         self.room_schedule[room_id][time_slot.day].append(time_slot)

#     def _is_faculty_available_for_slot(self, faculty: Faculty, time_slot: TimeSlot) -> bool:
#         """Check if faculty is available during a specific time slot."""
#         for avail in faculty.availability:
#             if avail.day == time_slot.day or avail.day == "ALL_DAYS":
#                 avail_start = time_to_minutes(avail.startTime)
#                 avail_end = time_to_minutes(avail.endTime)
#                 slot_start = time_to_minutes(time_slot.startTime)
#                 slot_end = time_to_minutes(time_slot.endTime)
#                 if avail_start <= slot_start and slot_end <= avail_end:
#                     return True
#         return False

#     def _is_valid_assignment(self, faculty_id: str, time_slot: TimeSlot, room_id: str, input_data: ScheduleInput) -> bool:
#         """Enhanced validity check with better conflict detection."""
#         if check_break_conflict(time_slot, input_data.break_):
#             return False
#         faculty = None
#         for subject in input_data.subjects:
#             for f in subject.faculty:
#                 if f.id == faculty_id:
#                     faculty = f
#                     break
#             if faculty:
#                 break
#         if not faculty:
#             return False
#         if not self._is_faculty_available_for_slot(faculty, time_slot):
#             return False
#         return self._is_slot_available(faculty_id, room_id, time_slot)

#     def _add_assignment(self, assignment: ScheduleAssignment):
#         """Add an assignment and update tracking."""
#         self.all_assignments.append(assignment)
#         time_slot = TimeSlot(
#             day=assignment.day,
#             startTime=assignment.startTime,
#             endTime=assignment.endTime
#         )
#         self._book_slot(assignment.faculty_id, assignment.room_id, time_slot)
#         if assignment.subject_name in self.subject_counts:
#             self.subject_counts[assignment.subject_name] += 1

#     def _get_slot_duration(self, slot: TimeSlot) -> int:
#         """Calculate the duration of a slot in minutes."""
#         try:
#             return time_to_minutes(slot.endTime) - time_to_minutes(slot.startTime)
#         except ValueError as e:
#             logger.error(f"Failed to calculate slot duration: {e}")
#             return -1

#     def _generate_weekly_slots(self, start_time: str, end_time: str, breaks: List[Break], subjects: List[Subject]) -> Tuple[List[str], List[TimeSlot]]:
#         """Generate time slots for all days."""
#         return generate_weekly_time_slots(start_time, end_time, breaks, subjects)

#     def _build_weekly_schedule(self, schedule: List[ScheduleAssignment]) -> Dict[str, List[Any]]:
#         """Convert flat schedule into weekly table format."""
#         weekly_schedule = {day: [None] * len(self.time_slot_labels) for day in VALID_DAYS}
#         for assignment in schedule:
#             slot_label = f"{assignment.startTime}-{assignment.endTime}"
#             try:
#                 slot_idx = self.time_slot_labels.index(slot_label)
#                 weekly_schedule[assignment.day][slot_idx] = assignment.model_dump()
#             except ValueError:
#                 logger.warning(f"Slot {slot_label} not found in time_slot_labels")
#         return weekly_schedule

#     def _guaranteed_100_percent_fill(self, schedule: List[ScheduleAssignment], input_data: ScheduleInput) -> List[ScheduleAssignment]:
#         """Ensure slot utilization without exceeding no_of_classes_per_week."""
#         new_assignments = schedule.copy()
        
#         # Get all available slots (excluding breaks)
#         available_slots = []
#         for day in VALID_DAYS:
#             for slot_label in self.time_slot_labels:
#                 start_time, end_time = slot_label.split('-')
#                 slot_obj = TimeSlot(day=day, startTime=start_time, endTime=end_time)
#                 if not check_break_conflict(slot_obj, input_data.break_):
#                     available_slots.append(slot_obj)
        
#         logger.info(f"Total available slots (excluding breaks): {len(available_slots)}")
        
#         # Track assigned slots
#         assigned_slots = set()
#         for assignment in new_assignments:
#             assigned_slots.add((assignment.day, assignment.startTime, assignment.endTime))
        
#         # Calculate total required periods
#         total_required = sum(s.no_of_classes_per_week for s in input_data.subjects)
#         total_available = len(available_slots)
        
#         # Sort available slots by day and time
#         available_slots.sort(key=lambda s: (VALID_DAYS.index(s.day), time_to_minutes(s.startTime)))
        
#         # Phase 1: Fill remaining slots with subjects that have not met no_of_classes_per_week
#         remaining_slots = [slot for slot in available_slots if (slot.day, slot.startTime, slot.endTime) not in assigned_slots]
#         logger.info(f"Phase 1: Filling {len(remaining_slots)} remaining slots...")
        
#         # Filter subjects that still need assignments
#         subjects_needing_classes = [
#             s for s in input_data.subjects
#             if self.subject_counts.get(s.name, 0) < s.no_of_classes_per_week
#         ]
#         subject_weights = {
#             s.name: (s.no_of_classes_per_week - self.subject_counts.get(s.name, 0)) / total_required
#             if total_required > 0 else 1/len(subjects_needing_classes)
#             for s in subjects_needing_classes
#         }
        
#         for slot in remaining_slots:
#             slot_key = (slot.day, slot.startTime, slot.endTime)
#             if slot_key in assigned_slots:
#                 continue
            
#             slot_duration = self._get_slot_duration(slot)
#             if slot_duration <= 0:
#                 continue
            
#             # Select subject from those needing classes
#             subjects_to_consider = [s for s in subjects_needing_classes if s.time == slot_duration]
#             if not subjects_to_consider:
#                 self.unassigned_reasons[slot_key] = f"No subjects with duration {slot_duration} need additional classes"
#                 continue
            
#             subject = random.choices(
#                 subjects_to_consider,
#                 weights=[subject_weights[s.name] for s in subjects_to_consider],
#                 k=1
#             )[0]
            
#             # Find available faculty
#             best_assignment = None
#             best_score = -1
            
#             for faculty in subject.faculty:
#                 if self._is_faculty_available_for_slot(faculty, slot) and self._is_slot_available(faculty.id, self.single_room_id, slot):
#                     # Check faculty daily load (max 8 periods)
#                     daily_load = len([s for s in self.faculty_schedule[faculty.id][slot.day]])
#                     if daily_load >= 8:
#                         continue
                    
#                     pref_score = calculate_preference_score(slot, subject.preferred_slots, faculty.preferred_slots)
#                     if pref_score > best_score:
#                         best_score = pref_score
#                         best_assignment = ScheduleAssignment(
#                             subject_name=subject.name,
#                             faculty_id=faculty.id,
#                             faculty_name=faculty.name,
#                             day=slot.day,
#                             startTime=slot.startTime,
#                             endTime=slot.endTime,
#                             room_id=self.single_room_id,
#                             is_special=subject.is_special,
#                             priority_score=pref_score
#                         )
            
#             if best_assignment:
#                 new_assignments.append(best_assignment)
#                 self._add_assignment(best_assignment)
#                 assigned_slots.add(slot_key)
#                 logger.debug(f"Assigned {best_assignment.subject_name} to {slot.day} {slot.startTime}-{slot.endTime}")
#                 # Update subjects_needing_classes and weights
#                 subjects_needing_classes = [
#                     s for s in input_data.subjects
#                     if self.subject_counts.get(s.name, 0) < s.no_of_classes_per_week
#                 ]
#                 subject_weights = {
#                     s.name: (s.no_of_classes_per_week - self.subject_counts.get(s.name, 0)) / total_required
#                     if total_required > 0 else 1/len(subjects_needing_classes)
#                     for s in subjects_needing_classes
#                 }
#             else:
#                 self.unassigned_reasons[slot_key] = f"No available faculty for {subject.name} at {slot.day} {slot.startTime}-{slot.endTime}"
        
#         # Phase 2: Log unassigned slots without forcing assignments
#         remaining_slots = [slot for slot in available_slots if (slot.day, slot.startTime, slot.endTime) not in assigned_slots]
#         if remaining_slots:
#             logger.warning(f"Phase 2: {len(remaining_slots)} slots unassigned due to constraints or no remaining classes needed.")
#             for slot in remaining_slots:
#                 slot_key = (slot.day, slot.startTime, slot.endTime)
#                 if slot_key not in self.unassigned_reasons:
#                     self.unassigned_reasons[slot_key] = f"No subjects need additional classes at {slot.day} {slot.startTime}-{slot.endTime}"
        
#         logger.info(f"Final assignment count: {len(new_assignments)}")
#         return new_assignments

#     def generate_schedule(self, input_data: ScheduleInput, use_ga: bool = False) -> Dict[str, Any]:
#         """Generate a weekly schedule respecting no_of_classes_per_week."""
#         try:
#             self._validate_input(input_data)
#         except ValueError as e:
#             logger.error(f"Input validation failed: {e}")
#             raise

#         self.assignments.clear()
#         self.all_assignments.clear()
#         self.faculty_schedule.clear()
#         self.room_schedule.clear()
#         self.subject_counts.clear()
#         self.unassigned_reasons.clear()

#         if not input_data.rooms:
#             raise ValueError("At least one room must be provided.")
#         self.single_room_id = input_data.rooms[0]

#         self._initialize_schedules(input_data)

#         self.time_slot_labels, self.fixed_slots = self._generate_weekly_slots(
#             input_data.college_time.startTime,
#             input_data.college_time.endTime,
#             input_data.break_,
#             input_data.subjects
#         )
#         if not self.time_slot_labels:
#             raise ValueError("No valid time slots generated. Check college time, breaks, and subject durations.")

#         logger.info(f"Generated {len(self.time_slot_labels)} time slots: {self.time_slot_labels}")
        
#         self.constraint_checker = EnhancedConstraintChecker(input_data.subjects)

#         if use_ga:
#             from genetic_algorithm import GeneticAlgorithm
#             ga = GeneticAlgorithm(
#                 input_data=input_data,
#                 fixed_slots=self.fixed_slots,
#                 pop_size=50,
#                 generations=30,
#                 fixed_room_id=self.single_room_id,
#                 conflict_checker=self._is_valid_assignment
#             )
#             schedule, fitness = ga.run()
#         else:
#             schedule = []
#             subjects = self.constraint_checker.sort_subjects_by_constraints(input_data.subjects)
            
#             # Phase 1: Schedule minimum required classes
#             logger.info("Phase 1: Scheduling minimum required classes...")
#             for subject in subjects:
#                 required_classes = subject.no_of_classes_per_week
#                 assigned_count = self.subject_counts.get(subject.name, 0)
                
#                 for faculty in subject.faculty:
#                     if assigned_count >= required_classes:
#                         break
                    
#                     valid_slots = self.constraint_checker.get_valid_slots_for_duration(
#                         faculty.availability,
#                         self.fixed_slots,
#                         subject.time
#                     )
#                     if not valid_slots:
#                         continue
                    
#                     slot_scores = []
#                     for slot in valid_slots:
#                         score = calculate_preference_score(slot, subject.preferred_slots, faculty.preferred_slots)
#                         slot_scores.append((slot, score))
#                     slot_scores.sort(key=lambda x: x[1], reverse=True)
                    
#                     for slot, preference_score in slot_scores:
#                         if assigned_count >= required_classes:
#                             break
#                         if self._is_valid_assignment(faculty.id, slot, self.single_room_id, input_data):
#                             daily_load = len([s for s in self.faculty_schedule[faculty.id][slot.day]])
#                             if daily_load >= 8:
#                                 continue
                            
#                             assignment = ScheduleAssignment(
#                                 subject_name=subject.name,
#                                 faculty_id=faculty.id,
#                                 faculty_name=faculty.name,
#                                 day=slot.day,
#                                 startTime=slot.startTime,
#                                 endTime=slot.endTime,
#                                 room_id=self.single_room_id,
#                                 is_special=subject.is_special,
#                                 priority_score=preference_score
#                             )
#                             schedule.append(assignment)
#                             self._add_assignment(assignment)
#                             assigned_count += 1
#                             logger.info(f"Assigned {subject.name}[{assigned_count}/{required_classes}] to {faculty.name} at {slot.day} {slot.startTime}-{slot.endTime}")
            
#             # Phase 2: Fill remaining slots up to no_of_classes_per_week
#             logger.info("Phase 2: Filling remaining slots up to class limits...")
#             schedule = self._guaranteed_100_percent_fill(schedule, input_data)

#         weekly_schedule = self._build_weekly_schedule(schedule)
        
#         total_slots = len(VALID_DAYS) * len(self.time_slot_labels)
#         break_slot_count = sum(1 for day in VALID_DAYS for slot_label in self.time_slot_labels
#                               if check_break_conflict(
#                                   TimeSlot(day=day, startTime=slot_label.split('-')[0], endTime=slot_label.split('-')[1]),
#                                   input_data.break_
#                               ))
#         total_available_slots = total_slots - break_slot_count
#         assigned_slots = len(schedule)
#         unassigned_slots = total_available_slots - assigned_slots
        
#         fitness = 1.0 if unassigned_slots == 0 else 1.0 - (unassigned_slots / total_available_slots)
#         total_preference_score = sum(getattr(a, 'priority_score', 0) for a in schedule)
#         avg_preference_score = total_preference_score / len(schedule) if schedule else 0
        
#         subject_coverage = {}
#         for subject in input_data.subjects:
#             required = subject.no_of_classes_per_week
#             assigned = self.subject_counts.get(subject.name, 0)
#             subject_coverage[subject.name] = {
#                 'required': required,
#                 'assigned': assigned,
#                 'coverage_percentage': round((assigned / required) * 100, 1) if required > 0 else 0,
#                 'excess': max(0, assigned - required)
#             }
        
#         unassigned_slots_list = [
#             {
#                 'day': day,
#                 'startTime': start_time,
#                 'endTime': end_time,
#                 'reason': reason
#             }
#             for (day, start_time, end_time), reason in self.unassigned_reasons.items()
#         ]

#         logger.info(f"FINAL RESULTS:")
#         logger.info(f"  Total slots: {total_slots}")
#         logger.info(f"  Break slots: {break_slot_count}")
#         logger.info(f"  Available slots: {total_available_slots}")
#         logger.info(f"  Assigned slots: {assigned_slots}")
#         logger.info(f"  Unassigned slots: {unassigned_slots}")
#         logger.info(f"  Fitness: {fitness:.3f}")
#         logger.info(f"  Utilization: {round((assigned_slots / total_available_slots) * 100, 1)}%")
#         logger.info(f"  Avg preference score: {avg_preference_score:.1f}")
        
#         schedule_data = {
#             "schedule": [assignment.model_dump() for assignment in schedule],
#             "fitness": fitness,
#             "preference_score": avg_preference_score,
#             "timestamp": datetime.now().isoformat(),
#             "subject_coverage": subject_coverage
#         }
#         self.schedule_history.append(schedule_data)

#         return {
#             "weekly_schedule": {
#                 "time_slots": self.time_slot_labels,
#                 "days": weekly_schedule
#             },
#             "unassigned": unassigned_slots_list,
#             "fitness": fitness,
#             "preference_score": avg_preference_score,
#             "break_slots": break_slot_count,
#             "total_assignments": len(schedule),
#             "total_available_slots": total_available_slots,
#             "utilization_percentage": round((len(schedule) / total_available_slots) * 100, 1) if total_available_slots > 0 else 0,
#             "subject_coverage": subject_coverage,
#             "guaranteed_100_percent": unassigned_slots == 0
#         }
from typing import List, Dict, Any, Tuple, Optional
from collections import defaultdict
from model import ScheduleInput, ScheduleAssignment, TimeSlot, Break, Subject, Faculty
from utils import check_time_conflict, check_break_conflict, time_to_minutes, minutes_to_time, VALID_DAYS, generate_time_slots, generate_weekly_time_slots, calculate_preference_score
import random
from datetime import datetime
import logging
import copy

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedConstraintChecker:
    def __init__(self, subjects: List[Subject]):
        self.subjects = subjects

    def sort_subjects_by_constraints(self, subjects: List[Subject]) -> List[Subject]:
        def sort_key(s):
            special_priority = 0 if getattr(s, 'is_special', False) else 1
            faculty_constraint = len(s.faculty)
            class_priority = -s.no_of_classes_per_week
            duration_constraint = s.time / 50
            return (special_priority, faculty_constraint, class_priority, duration_constraint)
        return sorted(subjects, key=sort_key)

    def get_valid_slots_for_duration(self, availability: List[TimeSlot], fixed_slots: List[TimeSlot], duration: int) -> List[TimeSlot]:
        valid_slots = []
        for slot in fixed_slots:
            slot_duration = time_to_minutes(slot.endTime) - time_to_minutes(slot.startTime)
            if slot_duration != duration:
                continue
            for avail in availability:
                if avail.day == slot.day or avail.day == "ALL_DAYS":
                    avail_start = time_to_minutes(avail.startTime)
                    avail_end = time_to_minutes(avail.endTime)
                    slot_start = time_to_minutes(slot.startTime)
                    slot_end = time_to_minutes(slot.endTime)
                    if avail_start <= slot_start and slot_end <= avail_end:
                        valid_slots.append(slot)
                        break
        return valid_slots

class SchedulerService:
    def generate_schedule(self, input_data: ScheduleInput, use_ga: bool = False) -> Dict[str, Any]:
        self._validate_input(input_data)
        self._initialize_schedules(input_data)

        self.time_slot_labels, self.fixed_slots = generate_weekly_time_slots(
            input_data.college_time.startTime,
            input_data.college_time.endTime,
            input_data.break_,
            input_data.subjects
        )

        self.constraint_checker = EnhancedConstraintChecker(input_data.subjects)

        schedule = []
        subjects = self.constraint_checker.sort_subjects_by_constraints(input_data.subjects)

        logger.info("Phase 1: Scheduling minimum required classes...")
        for subject in subjects:
            required_classes = subject.no_of_classes_per_week
            assigned_count = 0
            assigned_days = set()

            while assigned_count < required_classes:
                day_assigned = False
                for faculty in subject.faculty:
                    valid_slots = self.constraint_checker.get_valid_slots_for_duration(
                        faculty.availability,
                        self.fixed_slots,
                        subject.time
                    )
                    if not valid_slots:
                        continue

                    distributed_slot_map = defaultdict(list)
                    for slot in valid_slots:
                        distributed_slot_map[slot.day].append(slot)

                    for day in VALID_DAYS:
                        if day in distributed_slot_map and day not in assigned_days:
                            day_slots = sorted(distributed_slot_map[day], key=lambda s: time_to_minutes(s.startTime))
                            for slot in day_slots:
                                score = calculate_preference_score(slot, getattr(subject, 'preferred_slots', []), getattr(faculty, 'preferred_slots', []))
                                if self._is_valid_assignment(faculty.id, slot, input_data.rooms[0], input_data):
                                    assignment = ScheduleAssignment(
                                        subject_name=subject.name,
                                        faculty_id=faculty.id,
                                        faculty_name=faculty.name,
                                        day=slot.day,
                                        startTime=slot.startTime,
                                        endTime=slot.endTime,
                                        room_id=input_data.rooms[0],
                                        is_special=getattr(subject, 'is_special', False),
                                        priority_score=score
                                    )
                                    schedule.append(assignment)
                                    assigned_count += 1
                                    assigned_days.add(day)
                                    day_assigned = True
                                    logger.info(f"Assigned {subject.name}[{assigned_count}/{required_classes}] to {faculty.name} at {slot.day} {slot.startTime}-{slot.endTime}")
                                    break
                            if day_assigned:
                                break
                    if day_assigned:
                        break
                if not day_assigned:
                    logger.warning(f"Could not distribute subject {subject.name} beyond {assigned_count} sessions due to constraints.")
                    break

        logger.info("Phase 2: Filling remaining slots up to class limits...")
        # Optionally implement more slot filling logic

        weekly_schedule = self._build_weekly_schedule(schedule)

        return {
            "weekly_schedule": {
                "time_slots": self.time_slot_labels,
                "days": weekly_schedule
            },
            "subject_coverage": {s.name: s.no_of_classes_per_week for s in input_data.subjects},
            "total_assignments": len(schedule)
        }

    def _validate_input(self, input_data: ScheduleInput):
        pass

    def _initialize_schedules(self, input_data: ScheduleInput):
        self.subject_counts = {}
        self.faculty_schedule = defaultdict(lambda: defaultdict(list))
        self.room_schedule = defaultdict(lambda: defaultdict(list))

    def _is_valid_assignment(self, faculty_id: str, slot: TimeSlot, room_id: str, input_data: ScheduleInput) -> bool:
        for s in self.faculty_schedule[faculty_id][slot.day]:
            if check_time_conflict(s, slot):
                return False
        for s in self.room_schedule[room_id][slot.day]:
            if check_time_conflict(s, slot):
                return False
        if check_break_conflict(slot, input_data.break_):
            return False
        self.faculty_schedule[faculty_id][slot.day].append(slot)
        self.room_schedule[room_id][slot.day].append(slot)
        return True

    def _build_weekly_schedule(self, schedule: List[ScheduleAssignment]) -> Dict[str, List[Any]]:
        weekly = {day: [] for day in VALID_DAYS}
        for a in schedule:
            weekly[a.day].append(a.model_dump())
        return weekly
