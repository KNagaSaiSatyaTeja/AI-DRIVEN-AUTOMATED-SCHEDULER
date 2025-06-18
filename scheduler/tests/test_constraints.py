import pytest
from model import ScheduleInput, Subject, Faculty, TimeSlot, CollegeTime, Break, ScheduleAssignment
from constraints import ConstraintChecker

@pytest.fixture
def input_data():
    return ScheduleInput(
        subjects=[
            Subject(
                name="Math",
                faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])],
                student_group="G1"
            ),
            Subject(
                name="Physics",
                faculty=[Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_10:00 AM"])],
                student_group="G2"
            )
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1", "R2"]
    )

# Test Case 11: No constraint violations
def test_no_violations(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1")
    ]
    assert len(checker.check_constraints(schedule)) == 0
    assert checker.calculate_fitness(schedule) == 0

# Test Case 12: Room conflict
def test_room_conflict(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1"),
        ScheduleAssignment(subject="Physics", faculty_id="T2", faculty_name="Bob", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G2", room_id="R1")
    ]
    violations = checker.check_constraints(schedule)
    assert any("Room R1 conflict" in v for v in violations)

# Test Case 13: Faculty conflict
def test_faculty_conflict(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1"),
        ScheduleAssignment(subject="Physics", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G2", room_id="R2")
    ]
    violations = checker.check_constraints(schedule)
    assert any("Faculty T1 conflict" in v for v in violations)

# Test Case 14: Student group conflict
def test_group_conflict(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1"),
        ScheduleAssignment(subject="Physics", faculty_id="T2", faculty_name="Bob", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R2")
    ]
    violations = checker.check_constraints(schedule)
    assert any("Group G1 conflict" in v for v in violations)

# Test Case 15: Break conflict
def test_break_conflict(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="12:30 PM", endTime="1:00 PM", student_group="G1", room_id="R1")
    ]
    violations = checker.check_constraints(schedule)
    assert any("during break" in v for v in violations)

# Test Case 16: Outside college hours
def test_outside_college_hours(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="8:00 AM", endTime="9:00 AM", student_group="G1", room_id="R1")
    ]
    violations = checker.check_constraints(schedule)
    assert any("outside college hours" in v for v in violations)

# Test Case 17: Soft constraint violation (non-preferred slot)
def test_soft_constraint_violation():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM"), TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="10:00 AM", endTime="11:00 AM", student_group="G1", room_id="R1")
    ]
    assert checker.calculate_fitness(schedule) == 10

# Test Case 18: Missing subjects
def test_missing_subjects(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1")
    ]
    violations = checker.check_constraints(schedule)
    assert any("Missing subjects" in v for v in violations)

# Test Case 19: Empty schedule
def test_empty_schedule(input_data):
    checker = ConstraintChecker(input_data)
    schedule = []
    violations = checker.check_constraints(schedule)
    assert any("Missing subjects" in v for v in violations)

# Test Case 20: Multiple violations
def test_multiple_violations(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1"),
        ScheduleAssignment(subject="Physics", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1")
    ]
    violations = checker.check_constraints(schedule)
    assert len(violations) >= 3  # Faculty, room, and group conflicts

# Test Case 21: Complex schedule with no violations
def test_complex_no_violations(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1"),
        ScheduleAssignment(subject="Physics", faculty_id="T2", faculty_name="Bob", day="Mon", startTime="10:00 AM", endTime="11:00 AM", student_group="G2", room_id="R2")
    ]
    assert len(checker.check_constraints(schedule)) == 0

# Test Case 22: Overlapping times on different days
def test_different_days_no_conflict(input_data):
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1"),
        ScheduleAssignment(subject="Physics", faculty_id="T1", faculty_name="Alice", day="Tue", startTime="9:00 AM", endTime="10:00 AM", student_group="G2", room_id="R1")
    ]
    assert len(checker.check_constraints(schedule)) == 1  # Missing subjects

# Test Case 23: Invalid day in schedule
def test_invalid_day():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Invalid", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1")
    ]
    assert len(checker.check_constraints(schedule)) > 0

# Test Case 24: No breaks
def test_no_breaks():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="9:00 AM", endTime="10:00 AM", student_group="G1", room_id="R1")
    ]
    assert len(checker.check_constraints(schedule)) == 0

# Test Case 25: High fitness due to multiple soft violations
def test_high_fitness_soft_violations():
    input_data = ScheduleInput(
        subjects=[
            Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM"), TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1"),
            Subject(name="Physics", faculty=[Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM"), TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G2")
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1", "R2"]
    )
    checker = ConstraintChecker(input_data)
    schedule = [
        ScheduleAssignment(subject="Math", faculty_id="T1", faculty_name="Alice", day="Mon", startTime="10:00 AM", endTime="11:00 AM", student_group="G1", room_id="R1"),
        ScheduleAssignment(subject="Physics", faculty_id="T2", faculty_name="Bob", day="Mon", startTime="10:00 AM", endTime="11:00 AM", student_group="G2", room_id="R2")
    ]
    assert checker.calculate_fitness(schedule) == 20  # Two soft violations