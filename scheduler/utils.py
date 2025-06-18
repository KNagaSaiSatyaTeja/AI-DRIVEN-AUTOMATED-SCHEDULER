from typing import List, Tuple
from model import TimeSlot, Break, PreferredSlot
import re

# Valid days of the week
VALID_DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]

def time_to_minutes(time_str: str) -> int:
    """Convert time string (HH:MM or HH:MM AM/PM) to minutes since midnight."""
    # Handle AM/PM format
    if 'AM' in time_str.upper() or 'PM' in time_str.upper():
        time_str = time_str.upper().strip()
        is_pm = 'PM' in time_str
        time_part = time_str.replace('AM', '').replace('PM', '').strip()
        
        if not re.match(r'^\d{1,2}:\d{2}$', time_part):
            raise ValueError(f"Invalid time format: {time_str}. Expected format: HH:MM AM/PM")
        
        hours, minutes = map(int, time_part.split(':'))
        
        # Convert to 24-hour format
        if is_pm and hours != 12:
            hours += 12
        elif not is_pm and hours == 12:
            hours = 0
            
        if hours < 0 or hours > 23 or minutes < 0 or minutes > 59:
            raise ValueError(f"Invalid time values in {time_str}")
        
        return hours * 60 + minutes
    
    # Handle 24-hour format
    if not re.match(r'^\d{1,2}:\d{2}$', time_str):
        raise ValueError(f"Invalid time format: {time_str}. Expected format: HH:MM or HH:MM AM/PM")
    
    hours, minutes = map(int, time_str.split(':'))
    if hours < 0 or hours > 23 or minutes < 0 or minutes > 59:
        raise ValueError(f"Invalid time values in {time_str}. Hours must be 0-23, minutes 0-59")
    
    return hours * 60 + minutes

def minutes_to_time(minutes: int) -> str:
    """Convert minutes since midnight to time string (HH:MM)."""
    if minutes < 0 or minutes > 1439:  # 23:59 = 1439 minutes
        raise ValueError(f"Invalid minutes value: {minutes}. Must be between 0 and 1439")
    
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"

def check_time_conflict(slot1: TimeSlot, slot2: TimeSlot) -> bool:
    """Check if two time slots conflict with each other."""
    if slot1.day != slot2.day:
        return False
    
    start1 = time_to_minutes(slot1.startTime)
    end1 = time_to_minutes(slot1.endTime)
    start2 = time_to_minutes(slot2.startTime)
    end2 = time_to_minutes(slot2.endTime)
    
    # Check if one slot starts during the other slot
    return (start1 < end2 and start2 < end1)

def check_break_conflict(slot: TimeSlot, breaks: List[Break]) -> bool:
    """Check if a time slot conflicts with any break, including ALL_DAYS breaks."""
    for break_slot in breaks:
        # Handle ALL_DAYS break - applies to every day
        if break_slot.day == "ALL_DAYS" or break_slot.day == slot.day:
            break_start = time_to_minutes(break_slot.startTime)
            break_end = time_to_minutes(break_slot.endTime)
            slot_start = time_to_minutes(slot.startTime)
            slot_end = time_to_minutes(slot.endTime)
            
            # Check if the slot overlaps with the break
            if slot_start < break_end and break_start < slot_end:
                return True
    
    return False

def calculate_preference_score(slot: TimeSlot, subject_preferences: List[PreferredSlot], faculty_preferences: List[PreferredSlot]) -> int:
    """Calculate preference score for a slot based on subject and faculty preferences."""
    score = 0
    
    # Check subject preferences
    for pref in subject_preferences:
        if (pref.day == "ANY_DAY" or pref.day == slot.day):
            pref_start = time_to_minutes(pref.startTime)
            pref_end = time_to_minutes(pref.endTime)
            slot_start = time_to_minutes(slot.startTime)
            slot_end = time_to_minutes(slot.endTime)
            
            # If slot fits within preferred time
            if pref_start <= slot_start and slot_end <= pref_end:
                score += (6 - pref.priority) * 10  # Higher priority = higher score
    
    # Check faculty preferences
    for pref in faculty_preferences:
        if (pref.day == "ANY_DAY" or pref.day == slot.day):
            pref_start = time_to_minutes(pref.startTime)
            pref_end = time_to_minutes(pref.endTime)
            slot_start = time_to_minutes(slot.startTime)
            slot_end = time_to_minutes(slot.endTime)
            
            # If slot fits within preferred time
            if pref_start <= slot_start and slot_end <= pref_end:
                score += (6 - pref.priority) * 5  # Faculty preferences worth less than subject
    
    return score

def generate_time_slots(start_time: str, end_time: str, breaks: List[Break], subjects: List) -> List[str]:
    """Generate non-overlapping time slot labels, excluding ALL_DAYS breaks."""
    start_minutes = time_to_minutes(start_time)
    end_minutes = time_to_minutes(end_time)
    
    # Get unique subject durations and sort them
    durations = sorted(set(subject.time for subject in subjects))
    if not durations:
        return []
    
    # Use the smallest duration as the base unit
    base_duration = min(durations)
    
    # Generate sequential time slots without overlaps
    time_slots = []
    current_time = start_minutes
    
    while current_time + base_duration <= end_minutes:
        # For each duration, create a slot starting at current_time
        for duration in durations:
            if current_time + duration <= end_minutes:
                slot_start = minutes_to_time(current_time)
                slot_end = minutes_to_time(current_time + duration)
                slot_label = f"{slot_start}-{slot_end}"
                
                # Check if this slot conflicts with any break (including ALL_DAYS)
                temp_slot = TimeSlot(day="MONDAY", startTime=slot_start, endTime=slot_end)
                if not check_break_conflict(temp_slot, breaks):
                    time_slots.append(slot_label)
        
        # Move to next time slot
        current_time += base_duration
    
    # Remove duplicates and sort
    unique_slots = sorted(set(time_slots), key=lambda x: (time_to_minutes(x.split('-')[0]), time_to_minutes(x.split('-')[1])))
    
    # Filter out overlapping slots - keep only non-overlapping ones
    non_overlapping = []
    for slot in unique_slots:
        start, end = slot.split('-')
        slot_start = time_to_minutes(start)
        slot_end = time_to_minutes(end)
        
        # Check if this slot overlaps with any already selected slot
        overlaps = False
        for existing in non_overlapping:
            ex_start, ex_end = existing.split('-')
            ex_start_min = time_to_minutes(ex_start)
            ex_end_min = time_to_minutes(ex_end)
            
            # Check for overlap
            if slot_start < ex_end_min and ex_start_min < slot_end:
                overlaps = True
                break
        
        if not overlaps:
            non_overlapping.append(slot)
    
    return non_overlapping

def generate_weekly_time_slots(start_time: str, end_time: str, breaks: List[Break], subjects: List) -> Tuple[List[str], List[TimeSlot]]:
    """Generate time slots for all days of the week, excluding ALL_DAYS breaks."""
    time_slot_labels = generate_time_slots(start_time, end_time, breaks, subjects)
    
    # Create TimeSlot objects for each day and time slot
    fixed_slots = []
    for day in VALID_DAYS:
        for slot_label in time_slot_labels:
            start, end = slot_label.split('-')
            slot = TimeSlot(day=day, startTime=start, endTime=end)
            
            # Skip slots that conflict with breaks (including ALL_DAYS)
            if not check_break_conflict(slot, breaks):
                fixed_slots.append(slot)
    
    return time_slot_labels, fixed_slots
