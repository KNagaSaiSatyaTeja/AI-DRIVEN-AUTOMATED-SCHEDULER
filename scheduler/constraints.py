from typing import List
from model import ScheduleInput, ScheduleAssignment, Subject, TimeSlot, Faculty
from utils import check_time_conflict, check_break_conflict, time_to_minutes

class ConstraintChecker:
    def __init__(self, subjects: List[Subject]):
        self.subjects = subjects

    def sort_subjects_by_constraints(self, subjects: List[Subject]) -> List[Subject]:
        """Sort subjects by number of faculty (fewer faculty = more constrained)."""
        return sorted(subjects, key=lambda s: len(s.faculty))

    def calculate_fitness(self, schedule: List[ScheduleAssignment], input_data: ScheduleInput) -> float:
        """Calculate fitness based on unassigned subjects, unmet class requirements, and conflicts."""
        # Count how many times each subject is scheduled
        subject_counts = {}
        for s in input_data.subjects:
            subject_counts[s.name] = 0
        for a in schedule:
            subject_counts[a.subject_name] += 1

        # Penalty for unmet class requirements
        unmet_requirements = 0
        for s in input_data.subjects:
            required = s.no_of_classes_per_week
            scheduled = subject_counts.get(s.name, 0)
            if scheduled < required:
                unmet_requirements += (required - scheduled)

        # Penalty for conflicts
        conflicts = 0
        for i, a1 in enumerate(schedule):
            slot1 = TimeSlot(a1.day, a1.startTime, a1.endTime)
            for a2 in schedule[i+1:]:
                slot2 = TimeSlot(a2.day, a2.startTime, a2.endTime)
                if (a1.faculty_id == a2.faculty_id or a1.room_id == a2.room_id) and check_time_conflict(slot1, slot2):
                    conflicts += 1
            if check_break_conflict(slot1, input_data.break_):
                conflicts += 1

        fitness = unmet_requirements * 1000 + conflicts * 10
        print(f"[DEBUG] Fitness: {fitness} (unmet requirements: {unmet_requirements}, conflicts: {conflicts})")
        return fitness

    def get_valid_slots(self, availability: List[TimeSlot], fixed_slots: List[TimeSlot], duration: int) -> List[TimeSlot]:
        """Filter fixed slots that are within faculty availability and match duration."""
        valid_slots = []
        for fixed_slot in fixed_slots:
            slot_duration = time_to_minutes(fixed_slot.endTime) - time_to_minutes(fixed_slot.startTime)
            if slot_duration != duration:
                continue
            for avail in availability:
                if fixed_slot.day == avail.day:
                    try:
                        avail_start = time_to_minutes(avail.startTime)
                        avail_end = time_to_minutes(avail.endTime)
                        slot_start = time_to_minutes(fixed_slot.startTime)
                        slot_end = time_to_minutes(fixed_slot.endTime)
                        if avail_start <= slot_start and slot_end <= avail_end:
                            valid_slots.append(fixed_slot)
                            print(f"[DEBUG] Valid slot for {fixed_slot.day}: {fixed_slot.startTime}-{fixed_slot.endTime}")
                            break
                    except ValueError as e:
                        print(f"[ERROR] Time parsing error in get_valid_slots: {e}")
        return valid_slots

    def check_constraints(self, faculty_id: str, time_slot: TimeSlot, room_id: str, input_data: ScheduleInput) -> bool:
        """Validate if an assignment meets all constraints."""
        faculty = None
        subject = None
        for s in input_data.subjects:
            for f in s.faculty:
                if f.id == faculty_id:
                    faculty = f
                    subject = s
                    break
            if faculty:
                break

        if not faculty or not subject:
            print(f"[DEBUG] Invalid faculty_id {faculty_id} or subject not found")
            return False

        valid_slot = False
        for avail in faculty.availability:
            if avail.day == time_slot.day:
                try:
                    avail_start = time_to_minutes(avail.startTime)
                    avail_end = time_to_minutes(avail.endTime)
                    slot_start = time_to_minutes(time_slot.startTime)
                    slot_end = time_to_minutes(time_slot.endTime)
                    if avail_start <= slot_start and slot_end <= avail_end:
                        valid_slot = True
                        break
                except ValueError as e:
                    print(f"[ERROR] Time parsing error in check_constraints: {e}")
                    return False
        if not valid_slot:
            print(f"[DEBUG] Slot {time_slot.startTime}-{time_slot.endTime} not in faculty {faculty_id} availability")
            return False

        if check_break_conflict(time_slot, input_data.break_):
            print(f"[DEBUG] Slot {time_slot.startTime}-{time_slot.endTime} conflicts with break")
            return False

        if room_id not in input_data.rooms:
            print(f"[DEBUG] Invalid room_id {room_id}")
            return False

        try:
            slot_duration = time_to_minutes(time_slot.endTime) - time_to_minutes(time_slot.startTime)
            if slot_duration != subject.time:  # Use subject.time instead of duration
                print(f"[DEBUG] Slot duration {slot_duration} does not match subject {subject.name} time {subject.time}")
                return False
        except ValueError as e:
            print(f"[ERROR] Duration check failed: {e}")
            return False

        return True