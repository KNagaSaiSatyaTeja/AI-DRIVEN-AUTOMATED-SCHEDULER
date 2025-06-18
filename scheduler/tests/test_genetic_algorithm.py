import pytest
from model import ScheduleInput, Subject, Faculty, TimeSlot, CollegeTime, Break
from genetic_algorithm import GeneticAlgorithm

@pytest.fixture
def input_data():
    return ScheduleInput(
        subjects=[
            Subject(
                name="Math",
                faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])],
                student_group="G1"
            )
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )

# Test Case 41: GA simple schedule
def test_ga_simple_schedule(input_data):
    ga = GeneticAlgorithm(input_data, pop_size=10, generations=5)
    schedule, fitness = ga.run()
    assert len(schedule) == 1
    assert fitness == 0

# Test Case 42: GA complex schedule
def test_ga_complex_schedule():
    input_data = ScheduleInput(
        subjects=[
            Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1"),
            Subject(name="Physics", faculty=[Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_10:00 AM"])], student_group="G2")
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1", "R2"]
    )
    ga = GeneticAlgorithm(input_data, pop_size=10, generations=5)
    schedule, fitness = ga.run()
    assert len(schedule) == 2
    assert fitness == 0

# Test Case 43: GA no valid slots
def test_ga_no_valid_slots():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="12:30 PM", endTime="1:00 PM")], preferred_slots=["Mon_12:30 PM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    ga = GeneticAlgorithm(input_data, pop_size=10, generations=5)
    schedule, fitness = ga.run()
    assert fitness > 0  # High fitness due to violations

# Test Case 44: GA soft constraint optimization
def test_ga_soft_constraint_optimization():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM"), TimeSlot(day="Mon", startTime="10:00 AM", endTime="11:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    ga = GeneticAlgorithm(input_data, pop_size=10, generations=5)
    schedule, fitness = ga.run()
    assert fitness <= 10  # Should prefer the optimal slot

# Test Case 45: GA large population
def test_ga_large_population(input_data):
    ga = GeneticAlgorithm(input_data, pop_size=100, generations=10)
    schedule, fitness = ga.run()
    assert len(schedule) == 1
    assert fitness == 0

# Test Case 46: GA low generations
def test_ga_low_generations(input_data):
    ga = GeneticAlgorithm(input_data, pop_size=5, generations=2)
    schedule, fitness = ga.run()
    assert len(schedule) == 1

# Test Case 47: GA multiple runs consistency
def test_ga_multiple_runs(input_data):
    fitnesses = []
    for _ in range(3):
        ga = GeneticAlgorithm(input_data, pop_size=10, generations=5)
        _, fitness = ga.run()
        fitnesses.append(fitness)
    assert all(f == fitnesses[0] for f in fitnesses)  # Consistent results

# Test Case 48: GA empty schedule
def test_ga_empty_schedule():
    input_data = ScheduleInput(
        subjects=[],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    ga = GeneticAlgorithm(input_data, pop_size=10, generations=5)
    schedule, fitness = ga.run()
    assert len(schedule) == 0
    assert fitness == float('inf')

# Test Case 49: GA invalid times
def test_ga_invalid_times():
    input_data = ScheduleInput(
        subjects=[Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="8:00 AM", endTime="9:00 AM")], preferred_slots=["Mon_8:00 AM"])], student_group="G1")],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1"]
    )
    ga = GeneticAlgorithm(input_data, pop_size=10, generations=5)
    schedule, fitness = ga.run()
    assert fitness > 0  # High fitness due to violation

# Test Case 50: GA multiple rooms
def test_ga_multiple_rooms():
    input_data = ScheduleInput(
        subjects=[
            Subject(name="Math", faculty=[Faculty(id="T1", name="Alice", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G1"),
            Subject(name="Physics", faculty=[Faculty(id="T2", name="Bob", availability=[TimeSlot(day="Mon", startTime="9:00 AM", endTime="10:00 AM")], preferred_slots=["Mon_9:00 AM"])], student_group="G2")
        ],
        break_=[Break(startTime="12:00 PM", endTime="1:00 PM")],
        college_time=CollegeTime(startTime="9:00 AM", endTime="5:00 PM"),
        rooms=["R1", "R2"]
    )
    ga = GeneticAlgorithm(input_data, pop_size=10, generations=5)
    schedule, fitness = ga.run()
    assert len(schedule) == 2
    assert fitness == 0