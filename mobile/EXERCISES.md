# Exercise Database

## Overview

Comprehensive exercise database with 105 exercises properly tagged for smart workout generation and substitution matching.

## Exercise Count by Category

- **Lower Body**: 20 exercises
  - Squat pattern: 7
  - Hinge pattern: 6
  - Hip extension: 2
  - Lunge pattern: 2
  - Single joint: 3

- **Upper Body Push**: 32 exercises
  - Chest: 13
  - Shoulders: 9
  - Triceps: 10

- **Upper Body Pull**: 18 exercises
  - Back (horizontal): 7
  - Back (vertical): 6
  - Biceps: 5

- **Core**: 13 exercises
  - Anti-extension: 3
  - Anti-rotation: 3
  - Rotation: 3
  - Flexion: 4

- **Functional/Power**: 16 exercises
  - Carries: 2
  - Olympic lifts: 3
  - Plyometrics: 4
  - Cardio: 5
  - Other: 2

- **Isolation**: 6 exercises
  - Traps, forearms, calves

## Tagging System

Each exercise includes:

### Primary Muscle Group
Main muscle targeted (e.g., "Quadriceps", "Chest", "Lats")

### Secondary Muscle Groups
Array of supporting muscles (e.g., ["Glutes", "Core", "Shoulders"])

### Equipment Required
Array of equipment needed (e.g., ["Barbell", "Bench"])
- Empty array means bodyweight only

### Movement Pattern
Categorizes by biomechanical pattern for substitution matching:
- Squat
- Hinge  
- Hip Extension
- Lunge
- Horizontal Push
- Vertical Push
- Horizontal Pull
- Vertical Pull
- Carry
- Jump
- Olympic Lift
- And more...

### Difficulty Level
- `beginner`: Suitable for newcomers
- `intermediate`: Requires some experience
- `advanced`: Complex technique required

### Flags
- `is_bodyweight`: True if no equipment needed
- `is_locked`: True for compound lifts that shouldn't be substituted (Squat, Bench, Deadlift)

## Seeding the Database

### Method 1: SQL Script (Partial)
```sql
-- Run in Supabase SQL Editor
-- See supabase/seed.sql for partial seed script
```

### Method 2: From App (Recommended)
The app includes utility functions to seed from JSON:

```typescript
import { seedExercises, checkExercisesExist } from './utils/exerciseDatabase';

// Check if exercises exist
const { exists, count } = await checkExercisesExist();

if (!exists) {
  // Seed all 105 exercises
  await seedExercises();
}
```

## Querying Exercises

### By Muscle Group
```typescript
const chestExercises = await getExercisesByMuscleGroup('Chest');
```

### By Equipment
```typescript
const dumbbellExercises = await getExercisesByEquipment(['Dumbbell']);
```

### Bodyweight Only
```typescript
const bodyweightExercises = await getBodyweightExercises();
```

### Search
```typescript
const results = await searchExercises('squat');
```

## Substitution Matching

The substitution algorithm prioritizes:

1. **Same movement pattern** + similar equipment
2. **Same movement pattern** + any equipment  
3. **Same primary muscle** + similar pattern
4. **Same primary muscle** + any pattern

Example:
```typescript
const substitutes = await findSubstituteExercises(
  'original-exercise-id',
  ['Dumbbell', 'Bench'] // Available equipment
);
```

For "Barbell Row" with only dumbbells available:
1. Returns Dumbbell Row (same pattern, matching equipment)
2. Then Seated Cable Row (same pattern, different equipment)
3. Then T-Bar Row (same muscle, similar pattern)

## Movement Pattern Details

### Squat Pattern
- Back Squat, Front Squat, Goblet Squat
- Leg Press, Hack Squat
- Bulgarian Split Squat
- Bodyweight Squat

### Hinge Pattern
- Conventional Deadlift, Romanian Deadlift, Sumo Deadlift
- Trap Bar Deadlift, Single Leg Deadlift
- Good Morning

### Horizontal Push
- Barbell/Dumbbell Bench Press variations
- Push-ups
- Cable Flys
- Chest Dips

### Horizontal Pull
- Barbell/Dumbbell/Cable Rows
- Inverted Row
- T-Bar Row
- Chest Supported Row

### Vertical Push
- Overhead Press variations
- Dumbbell/Seated Press
- Arnold Press

### Vertical Pull
- Pull-Ups, Chin-Ups
- Lat Pulldown variations
- Assisted Pull-Ups

## Locked Exercises

Three primary compound lifts are marked as `is_locked: true`:
- Barbell Back Squat
- Barbell Bench Press
- Conventional Deadlift

These should not appear in substitution suggestions as they're core strength movements.

## Adding Custom Exercises

Users can add custom exercises (future feature):

```typescript
const newExercise = {
  name: "Custom Movement",
  description: "How to perform...",
  primary_muscle_group: "Chest",
  secondary_muscle_groups: ["Triceps"],
  equipment_required: ["Cables"],
  movement_pattern: "Horizontal Push",
  difficulty_level: "intermediate",
  is_bodyweight: false,
  is_locked: false
};

await supabase.from('exercises').insert(newExercise);
```

## Data Quality

All 105 exercises include:
- ✅ Clear, concise names
- ✅ Descriptive instructions
- ✅ Accurate muscle targeting
- ✅ Proper equipment tags
- ✅ Correct movement patterns
- ✅ Appropriate difficulty levels
- ✅ Bodyweight flags
- ✅ Lock status for compounds

## Future Enhancements

- Video URLs for form demonstrations
- Exercise images/animations
- Equipment alternatives (e.g., "kettlebell or dumbbell")
- Progression/regression relationships
- Injury contraindications
- Mobility requirements
