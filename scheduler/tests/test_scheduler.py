
import sys
import os

# Add the parent directory to system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))



import pytest
from model import ScheduleInput, Subject, Faculty, TimeSlot, CollegeTime, Break
from scheduler import SchedulerService

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

# Test Case 26: CSP valid schedule
def test_csp_valid_schedule(input_data):
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=False)
    assert len(result["schedule"]) == 2
    assert result["fitness"] == 0
    assert len(result["unassigned"]) == 0

# Test Case 27: GA valid schedule
def test_ga_valid_schedule(input_data):
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=True)
    assert len(result["schedule"]) == 2
    assert result["fitness"] == 0
    assert len(result["unassigned"]) == 0

# Test Case 28: CSP unassigned subject
def test_csp_unassigned_subject():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="12:30 PM", endTime="1:00 PM")], preferred_slots=["Mon_12:30 PM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=False)
    assert len(result["unassigned"]) == 1

# Test Case 29: GA unassigned subject
def test_ga_unassigned_subject():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="12:30 PM", endTime="1:00 PM")], preferred_slots=["Mon_12:30 PM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=True)
    assert len(result["unassigned"]) == 1

# Test Case 30: CSP complex schedule
def test_csp_complex_schedule():
    input_data = ScheduleInput(
        subjects=[
            Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1"),
            Subject(name="Physics", faculty=[Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_10:00 AM"])], student_group="G2"),
            Subject(name="Chemistry", faculty=[Faculty(id="T3", name="Charlie", availability=[TimeSlot(day="Tue", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Tue_9:00 AM"])], student_group="G3")
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1", "R2", "R3"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=False)
    assert len(result["schedule"]) == 3
    assert len(result["unassigned"]) == 0

# Test Case 31: GA complex schedule
def test_ga_complex_schedule():
    input_data = ScheduleInput(
        subjects=[
            Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1"),
            Subject(name="Physics", faculty=[Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_10:00 AM"])], student_group="G2"),
            Subject(name="Chemistry", faculty=[Faculty(id="T3", name="Charlie", availability=[TimeSlot(day="Tue", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Tue_9:00 AM"])], student_group="G3")
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1", "R2", "R3"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=True)
    assert len(result["schedule"]) == 3
    assert len(result["unassigned"]) == 0

# Test Case 32: CSP no rooms
def test_csp_no_rooms():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=[]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=False)
    assert len(result["unassigned"]) == 1

# Test Case 33: GA no rooms
def test_ga_no_rooms():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=[]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=True)
    assert len(result["unassigned"]) == 1

# Test Case 34: CSP no faculty availability
def test_csp_no_faculty_availability():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[], preferred_slots=[])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=False)
    assert len(result["unassigned"]) == 1

# Test Case 35: GA no faculty availability
def test_ga_no_faculty_availability():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[], preferred_slots=[])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=True)
    assert len(result["unassigned"]) == 1

# Test Case 36: CSP multiple faculty options
def test_csp_multiple_faculty():
    input_data = ScheduleInput(
        subjects=[
            Subject(
                name="Math",
                faculty=[
                    Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"]),
                    Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])
                ],
                student_group="G1"
            )
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=False)
    assert len(result["schedule"]) == 1

# Test Case 37: GA multiple faculty options
def test_ga_multiple_faculty():
    input_data = ScheduleInput(
        subjects=[
            Subject(
                name="Math",
                faculty=[
                    Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"]),
                    Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])
                ],
                student_group="G1"
            )
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=True)
    assert len(result["schedule"]) == 1

# Test Case 38: CSP overlapping faculty availability
def test_csp_overlapping_faculty_availability():
    input_data = ScheduleInput(
        subjects=[
            Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1"),
            Subject(name="Physics", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G2")
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=False)
    assert len(result["unassigned"]) == 1

# Test Case 39: GA overlapping faculty availability
def test_ga_overlapping_faculty_availability():
    input_data = ScheduleInput(
        subjects=[
            Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1"),
            Subject(name="Physics", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G2")
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=True)
    assert len(result["unassigned"]) == 1

# Test Case 40: CSP soft constraint optimization
def test_csp_soft_constraint_optimization():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM"), TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    scheduler = SchedulerService()
    result = scheduler.generate_schedule(input_data, use_ga=False)
    assert result["fitness"] == 0  # Should pick preferred slot