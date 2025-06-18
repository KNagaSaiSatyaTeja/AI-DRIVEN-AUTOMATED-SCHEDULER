import pytest
from model import TimeSlot, Faculty, Subject, ScheduleInput, CollegeTime, Break

# Test Case 1: Valid ScheduleInput
def test_valid_schedule_input():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    assert len(input_data.subjects) == 1
    assert input_data.subjects[0].student_group == "G1"

# Test Case 2: Invalid TimeSlot (empty day)
def test_invalid_timeslot_empty_day():
    with pytest.raises(ValueError):
        TimeSlot(day="", startTime="9:00 AM", endTime="10:00 AM")

# Test Case 3: Invalid Break (same start/end time)
def test_invalid_break_same_time():
    with pytest.raises(ValueError):
        Break(startTime="12:00 PM", endTime="12:00 PM")

# Test Case 4: Faculty with no availability
def test_faculty_no_availability():
    faculty = Faculty(id="T1", name="Alice", availability=[], preferred_slots=[])
    assert faculty.availability == []
    assert faculty.preferred_slots == []

# Test Case 5: Subject with multiple faculty
def test_subject_multiple_faculty():
    subject = Subject(
        name="Math",
        faculty=[
            Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"]),
            Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Tue", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Tue_9:00 AM"])
        ],
        student_group="G1"
    )
    assert len(subject.faculty) == 2

# Test Case 6: Empty subjects list
def test_empty_subjects():
    input_data = ScheduleInput(
        subjects=[],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    assert len(input_data.subjects) == 0

# Test Case 7: Invalid college time (end before start)
def test_invalid_college_time():
    with pytest.raises(ValueError):
        CollegeTime(startTime="5:00 PM", endTime="9:00 AM")

# Test Case 8: No rooms provided
def test_no_rooms():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=[]
    )
    assert len(input_data.rooms) == 0

# Test Case 9: Invalid time format
def test_invalid_time_format():
    with pytest.raises(ValueError):
        TimeSlot(day="Mon", startTime="9:00", endTime="10:00 AM")

# Test Case 10: Complex input with multiple subjects
def test_complex_input():
    input_data = ScheduleInput(
        subjects=[
            Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1"),
            Subject(name="Physics", faculty=[Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Tue", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Tue_9:00 AM"])], student_group="G2")
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1", "R2"]
    )
    assert len(input_data.subjects) == 2
    assert len(input_data.rooms) == 2