import random
from typing import List, Callable, Tuple
import deap.base
import deap.creator
import deap.tools
from collections import defaultdict
from model import ScheduleInput, ScheduleAssignment, TimeSlot
from utils import check_time_conflict, check_break_conflict, time_to_minutes
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Define the fitness and individual types for DEAP
deap.creator.create("FitnessMin", deap.base.Fitness, weights=(-1.0,))
deap.creator.create("Individual", list, fitness=deap.creator.FitnessMin)

class GeneticAlgorithm:
    def __init__(self, input_data: ScheduleInput, fixed_slots: List[TimeSlot], pop_size: int = 100, generations: int = 50, fixed_room_id: str = "R1", conflict_checker: Callable = None):
        self.input_data = input_data
        self.fixed_slots = fixed_slots
        self.pop_size = pop_size
        self.generations = generations
        self.fixed_room_id = fixed_room_id
        self.conflict_checker = conflict_checker
        self.toolbox = deap.base.Toolbox()
        self.assignable_slots = self._get_assignable_slots()
        self._setup_ga()

    def _get_assignable_slots(self) -> List[TimeSlot]:
        """Filter out slots that overlap with breaks and return assignable slots."""
        assignable_slots = []
        for slot in self.fixed_slots:
            slot_obj = TimeSlot(day=slot.day, startTime=slot.startTime, endTime=slot.endTime)
            if check_break_conflict(slot_obj, self.input_data.break_):
                logger.debug(f"Excluding slot {slot.day} {slot.startTime}-{slot.endTime} due to break conflict")
                continue
            assignable_slots.append(slot)
        logger.info(f"Total assignable slots: {len(assignable_slots)}")
        return assignable_slots

    def _get_slot_duration(self, slot: TimeSlot) -> int:
        """Calculate the duration of a slot in minutes with error handling."""
        try:
            slot_duration = time_to_minutes(slot.endTime) - time_to_minutes(slot.startTime)
            if slot_duration <= 0:
                logger.error(f"Invalid slot duration for {slot.day} {slot.startTime}-{slot.endTime}: {slot_duration} minutes")
                return -1
            return slot_duration
        except ValueError as e:
            logger.error(f"Failed to calculate slot duration for {slot.day} {slot.startTime}-{slot.endTime}: {e}")
            return -1

    def _create_individual(self) -> List[ScheduleAssignment]:
        """Create an individual by scheduling subjects across all non-break slots."""
        schedule = []
        used_slots_per_faculty = defaultdict(list)
        used_slots_per_room = defaultdict(list)
        subject_counts = {subject.name: 0 for subject in self.input_data.subjects}

        # Step 1: Meet the minimum requirements for each subject
        subjects_to_assign = []
        for subject in self.input_data.subjects:
            for _ in range(subject.no_of_classes_per_week):
                subjects_to_assign.append(subject)
        random.shuffle(subjects_to_assign)

        for subject in subjects_to_assign:
            assigned = False
            for faculty in random.sample(subject.faculty, len(subject.faculty)):
                valid_slots = []
                for slot in self.assignable_slots:
                    slot_duration = self._get_slot_duration(slot)
                    if slot_duration != subject.time:
                        continue
                    for avail in faculty.availability:
                        if slot.day == avail.day:
                            try:
                                avail_start = time_to_minutes(avail.startTime)
                                avail_end = time_to_minutes(avail.endTime)
                                slot_start = time_to_minutes(slot.startTime)
                                slot_end = time_to_minutes(slot.endTime)
                                if avail_start <= slot_start and slot_end <= avail_end:
                                    valid_slots.append(slot)
                                    break
                            except ValueError as e:
                                logger.error(f"Time parsing error in _create_individual for faculty {faculty.id}: {e}")
                                continue

                if not valid_slots:
                    continue

                for slot in random.sample(valid_slots, len(valid_slots)):
                    if any(slot.day == s.day and check_time_conflict(slot, s)
                           for s in used_slots_per_faculty[faculty.id] + used_slots_per_room[self.fixed_room_id]):
                        continue
                    if self.conflict_checker and not self.conflict_checker(faculty.id, slot, self.fixed_room_id, self.input_data):
                        continue

                    assignment = ScheduleAssignment(
                        subject_name=subject.name,
                        faculty_id=faculty.id,
                        faculty_name=faculty.name,
                        day=slot.day,
                        startTime=slot.startTime,
                        endTime=slot.endTime,
                        room_id=self.fixed_room_id
                    )
                    schedule.append(assignment)
                    used_slots_per_faculty[faculty.id].append(slot)
                    used_slots_per_room[self.fixed_room_id].append(slot)
                    subject_counts[subject.name] += 1
                    assigned = True
                    logger.debug(f"Assigned {subject.name} to {faculty.name} at {slot.day} {slot.startTime}-{slot.endTime}")
                    break
                if assigned:
                    break

            if not assigned:
                logger.warning(f"Could not assign subject: {subject.name}")

        # Step 2: Fill all remaining slots, ignoring subject count limits
        used_slots = set((a.day, a.startTime, a.endTime) for a in schedule)
        remaining_slots = [slot for slot in self.assignable_slots
                          if (slot.day, slot.startTime, slot.endTime) not in used_slots]

        remaining_subjects = [subject for subject in self.input_data.subjects]
        random.shuffle(remaining_subjects)

        for slot in remaining_slots:
            slot_duration = self._get_slot_duration(slot)
            if slot_duration <= 0:
                continue
            subjects_to_consider = [s for s in remaining_subjects if s.time == slot_duration]
            if not subjects_to_consider:
                continue

            assigned = False
            for subject in subjects_to_consider:
                for faculty in random.sample(subject.faculty, len(subject.faculty)):
                    valid_slot = False
                    for avail in faculty.availability:
                        if slot.day == avail.day:
                            try:
                                avail_start = time_to_minutes(avail.startTime)
                                avail_end = time_to_minutes(avail.endTime)
                                slot_start = time_to_minutes(slot.startTime)
                                slot_end = time_to_minutes(slot.endTime)
                                if avail_start <= slot_start and slot_end <= avail_end:
                                    valid_slot = True
                                    break
                            except ValueError as e:
                                logger.error(f"Time parsing error in _create_individual for faculty {faculty.id}: {e}")
                                continue

                    if not valid_slot:
                        continue

                    if any(slot.day == s.day and check_time_conflict(slot, s)
                           for s in used_slots_per_faculty[faculty.id] + used_slots_per_room[self.fixed_room_id]):
                        continue
                    if self.conflict_checker and not self.conflict_checker(faculty.id, slot, self.fixed_room_id, self.input_data):
                        continue

                    assignment = ScheduleAssignment(
                        subject_name=subject.name,
                        faculty_id=faculty.id,
                        faculty_name=faculty.name,
                        day=slot.day,
                        startTime=slot.startTime,
                        endTime=slot.endTime,
                        room_id=self.fixed_room_id
                    )
                    schedule.append(assignment)
                    used_slots_per_faculty[faculty.id].append(slot)
                    used_slots_per_room[self.fixed_room_id].append(slot)
                    subject_counts[subject.name] = subject_counts.get(subject.name, 0) + 1
                    assigned = True
                    break
                if assigned:
                    break

        logger.info(f"Individual created with {len(schedule)} assignments")
        return schedule

    def _setup_ga(self):
        """Set up the genetic algorithm toolbox."""
        self.toolbox.register("individual", deap.tools.initIterate, deap.creator.Individual, self._create_individual)
        self.toolbox.register("population", self._valid_population)
        self.toolbox.register("evaluate", self._calculate_fitness)
        self.toolbox.register("mate", self._crossover)
        self.toolbox.register("mutate", self._mutate, indpb=0.2)
        self.toolbox.register("select", deap.tools.selTournament, tournsize=3)

    def _calculate_fitness(self, individual: List[ScheduleAssignment]) -> Tuple[float]:
        """Calculate the fitness of an individual based on constraints and coverage."""
        subject_counts = {subject.name: 0 for subject in self.input_data.subjects}
        for a in individual:
            subject_counts[a.subject_name] += 1

        class_requirement_penalty = 0
        for s in self.input_data.subjects:
            required = s.no_of_classes_per_week
            scheduled = subject_counts.get(s.name, 0)
            if scheduled < required:
                class_requirement_penalty += (required - scheduled) * 1000

        conflicts = 0
        used_slots_per_faculty = defaultdict(list)
        used_slots_per_room = defaultdict(list)
        for a in individual:
            slot = TimeSlot(day=a.day, startTime=a.startTime, endTime=a.endTime)
            if check_break_conflict(slot, self.input_data.break_):
                conflicts += 1
            for existing_slot in used_slots_per_faculty[a.faculty_id]:
                if slot.day == existing_slot.day and check_time_conflict(slot, existing_slot):
                    conflicts += 1
            for existing_slot in used_slots_per_room[a.room_id]:
                if slot.day == existing_slot.day and check_time_conflict(slot, existing_slot):
                    conflicts += 1
            used_slots_per_faculty[a.faculty_id].append(slot)
            used_slots_per_room[a.room_id].append(slot)

        used_slots = set((a.day, a.startTime, a.endTime) for a in individual)
        unfilled_slots = len(self.assignable_slots) - len(used_slots)
        unfilled_penalty = unfilled_slots * 5000

        fitness = class_requirement_penalty + (conflicts * 100) + unfilled_penalty
        return (fitness,)

    def _valid_population(self, n):
        """Generate a valid population, retrying if necessary."""
        pop = []
        attempts = 0
        max_attempts = 10000
        while len(pop) < n and attempts < max_attempts:
            individual = self.toolbox.individual()
            if len(individual) > 0:
                pop.append(individual)
            attempts += 1
            if attempts % 100 == 0:
                logger.info(f"Tried {attempts} individuals, population size: {len(pop)}")
        if len(pop) < n:
            logger.warning(f"Could only generate {len(pop)} individuals out of {n} requested")
        return pop

    def _crossover(self, ind1, ind2):
        """Perform crossover between two individuals while avoiding conflicts."""
        if len(ind1) < 2 or len(ind2) < 2:
            return ind1, ind2

        point = random.randint(1, min(len(ind1), len(ind2)) - 1)
        new_ind1, new_ind2 = [], []
        used_slots1_faculty = defaultdict(list)
        used_slots1_room = defaultdict(list)
        used_slots2_faculty = defaultdict(list)
        used_slots2_room = defaultdict(list)

        for a in ind1[:point]:
            slot = TimeSlot(day=a.day, startTime=a.startTime, endTime=a.endTime)
            if any(slot.day == s.day and check_time_conflict(slot, s)
                   for s in used_slots1_faculty[a.faculty_id] + used_slots1_room[a.room_id]):
                continue
            if check_break_conflict(slot, self.input_data.break_):
                continue
            new_ind1.append(a)
            used_slots1_faculty[a.faculty_id].append(slot)
            used_slots1_room[a.room_id].append(slot)

        for a in ind2[point:]:
            slot = TimeSlot(day=a.day, startTime=a.startTime, endTime=a.endTime)
            if any(slot.day == s.day and check_time_conflict(slot, s)
                   for s in used_slots1_faculty[a.faculty_id] + used_slots1_room[a.room_id]):
                continue
            if check_break_conflict(slot, self.input_data.break_):
                continue
            new_ind1.append(a)
            used_slots1_faculty[a.faculty_id].append(slot)
            used_slots1_room[a.room_id].append(slot)

        for a in ind2[:point]:
            slot = TimeSlot(day=a.day, startTime=a.startTime, endTime=a.endTime)
            if any(slot.day == s.day and check_time_conflict(slot, s)
                   for s in used_slots2_faculty[a.faculty_id] + used_slots2_room[a.room_id]):
                continue
            if check_break_conflict(slot, self.input_data.break_):
                continue
            new_ind2.append(a)
            used_slots2_faculty[a.faculty_id].append(slot)
            used_slots2_room[a.room_id].append(slot)

        for a in ind1[point:]:
            slot = TimeSlot(day=a.day, startTime=a.startTime, endTime=a.endTime)
            if any(slot.day == s.day and check_time_conflict(slot, s)
                   for s in used_slots2_faculty[a.faculty_id] + used_slots2_room[a.room_id]):
                continue
            if check_break_conflict(slot, self.input_data.break_):
                continue
            new_ind2.append(a)
            used_slots2_faculty[a.faculty_id].append(slot)
            used_slots2_room[a.room_id].append(slot)

        ind1[:] = new_ind1
        ind2[:] = new_ind2
        return ind1, ind2

    def _mutate(self, individual, indpb):
        """Mutate an individual by reassigning some assignments."""
        used_slots_per_faculty = defaultdict(list)
        used_slots_per_room = defaultdict(list)
        temp_schedule = []
        for a in individual:
            slot = TimeSlot(day=a.day, startTime=a.startTime, endTime=a.endTime)
            if any(slot.day == s.day and check_time_conflict(slot, s)
                   for s in used_slots_per_faculty[a.faculty_id] + used_slots_per_room[a.room_id]):
                continue
            if check_break_conflict(slot, self.input_data.break_):
                continue
            temp_schedule.append(a)
            used_slots_per_faculty[a.faculty_id].append(slot)
            used_slots_per_room[a.room_id].append(slot)
        individual[:] = temp_schedule

        for i in range(len(individual)):
            if random.random() < indpb:
                subject_name = individual[i].subject_name
                subject = next(s for s in self.input_data.subjects if s.name == subject_name)
                old_slot = TimeSlot(day=individual[i].day, startTime=individual[i].startTime, endTime=individual[i].endTime)
                used_slots_per_faculty[individual[i].faculty_id].remove(old_slot)
                used_slots_per_room[self.fixed_room_id].remove(old_slot)

                assigned = False
                for faculty in random.sample(subject.faculty, len(subject.faculty)):
                    valid_slots = []
                    for slot in self.assignable_slots:
                        slot_duration = self._get_slot_duration(slot)
                        if slot_duration != subject.time:
                            continue
                        for avail in faculty.availability:
                            if slot.day == avail.day:
                                try:
                                    avail_start = time_to_minutes(avail.startTime)
                                    avail_end = time_to_minutes(avail.endTime)
                                    slot_start = time_to_minutes(slot.startTime)
                                    slot_end = time_to_minutes(slot.endTime)
                                    if avail_start <= slot_start and slot_end <= avail_end:
                                        valid_slots.append(slot)
                                        break
                                except ValueError as e:
                                    logger.error(f"Time parsing error in _mutate for faculty {faculty.id}: {e}")
                                    continue

                    for slot in random.sample(valid_slots, len(valid_slots)):
                        if any(slot.day == s.day and check_time_conflict(slot, s)
                               for s in used_slots_per_faculty[faculty.id] + used_slots_per_room[self.fixed_room_id]):
                            continue
                        if self.conflict_checker and not self.conflict_checker(faculty.id, slot, self.fixed_room_id, self.input_data):
                            continue
                        individual[i] = ScheduleAssignment(
                            subject_name=subject.name,
                            faculty_id=faculty.id,
                            faculty_name=faculty.name,
                            day=slot.day,
                            startTime=slot.startTime,
                            endTime=slot.endTime,
                            room_id=self.fixed_room_id
                        )
                        used_slots_per_faculty[faculty.id].append(slot)
                        used_slots_per_room[self.fixed_room_id].append(slot)
                        assigned = True
                        break
                    if assigned:
                        break

                if not assigned:
                    logger.warning(f"Could not mutate assignment for {subject.name} at index {i}")

        return individual,

    def run(self) -> Tuple[List[ScheduleAssignment], float]:
        """Run the genetic algorithm to generate an optimized schedule."""
        logger.info("Starting Genetic Algorithm...")
        pop = self.toolbox.population(n=self.pop_size)
        logger.info(f"Initial population created: {len(pop)} individuals")

        fitnesses = list(map(self.toolbox.evaluate, pop))
        for ind, fit in zip(pop, fitnesses):
            ind.fitness.values = fit

        for gen in range(self.generations):
            logger.info(f"Generation {gen+1}/{self.generations}")
            offspring = self.toolbox.select(pop, len(pop))
            offspring = list(map(self.toolbox.clone, offspring))

            for c1, c2 in zip(offspring[::2], offspring[1::2]):
                if random.random() < 0.8:
                    self.toolbox.mate(c1, c2)
                    del c1.fitness.values
                    del c2.fitness.values

            for mutant in offspring:
                if random.random() < 0.2:
                    self.toolbox.mutate(mutant)
                    del mutant.fitness.values

            invalid_ind = [ind for ind in offspring if not ind.fitness.valid]
            fitnesses = map(self.toolbox.evaluate, invalid_ind)
            for ind, fit in zip(invalid_ind, fitnesses):
                ind.fitness.values = fit

            pop[:] = deap.tools.selBest(pop + offspring, k=self.pop_size)

        best = deap.tools.selBest(pop, k=1)[0]
        logger.info("Genetic Algorithm completed.")
        return best, best.fitness.values[0]
