-- 003_exercise_library.sql
-- Full exercise library seed + custom exercise support

-- Add created_by column to track user-created exercises (NULL = system exercise)
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add normalized equipment_category for easy UI filtering
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS equipment_category TEXT 
  CHECK (equipment_category IN ('barbell', 'dumbbell', 'machine', 'cable', 'kettlebell', 'bodyweight', 'other', 'custom'));

-- Add unique index on name scoped to system exercises for idempotent seeding
CREATE UNIQUE INDEX IF NOT EXISTS exercises_system_name_unique
  ON public.exercises(name)
  WHERE created_by IS NULL;

-- Allow authenticated users to insert their own custom exercises
CREATE POLICY "Users can create custom exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- Allow users to delete their own custom exercises
CREATE POLICY "Users can delete own custom exercises" ON public.exercises
  FOR DELETE USING (created_by = auth.uid());

-- Allow users to view their own custom exercises (SELECT policy already covers all)
-- The existing "Exercises are viewable by everyone" policy covers SELECT

-- Seed the exercise library (108 exercises)
INSERT INTO public.exercises (name, description, primary_muscle_group, secondary_muscle_groups, equipment_required, movement_pattern, difficulty_level, is_bodyweight, is_locked, equipment_category)
VALUES
  ('Barbell Back Squat', 'Stand with barbell on upper back, squat down keeping chest up, drive through heels to return', 'Quadriceps', ARRAY['Glutes', 'Hamstrings', 'Core'], ARRAY['Barbell', 'Squat Rack'], 'Squat', 'intermediate', false, true, 'barbell'),
  ('Barbell Front Squat', 'Hold barbell on front of shoulders, squat down maintaining upright torso', 'Quadriceps', ARRAY['Core', 'Upper Back'], ARRAY['Barbell', 'Squat Rack'], 'Squat', 'advanced', false, false, 'barbell'),
  ('Goblet Squat', 'Hold dumbbell or kettlebell at chest, squat down keeping elbows inside knees', 'Quadriceps', ARRAY['Glutes', 'Core'], ARRAY['Dumbbell'], 'Squat', 'beginner', false, false, 'dumbbell'),
  ('Leg Press', 'Sit in machine, push platform away with feet, lower with control', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], ARRAY['Leg Press Machine'], 'Squat', 'beginner', false, false, 'machine'),
  ('Hack Squat', 'Stand in hack squat machine, lower body by bending knees, push back up', 'Quadriceps', ARRAY['Glutes'], ARRAY['Hack Squat Machine'], 'Squat', 'intermediate', false, false, 'machine'),
  ('Bodyweight Squat', 'Squat down with no weight, arms extended forward for balance', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], ARRAY[]::text[], 'Squat', 'beginner', true, false, 'bodyweight'),
  ('Bulgarian Split Squat', 'Rear foot elevated on bench, lunge down on front leg', 'Quadriceps', ARRAY['Glutes', 'Balance'], ARRAY['Bench', 'Dumbbells (optional)'], 'Squat', 'intermediate', false, false, 'dumbbell'),
  ('Conventional Deadlift', 'Hinge at hips, grip barbell, drive through heels to stand tall', 'Hamstrings', ARRAY['Glutes', 'Lower Back', 'Traps'], ARRAY['Barbell'], 'Hinge', 'intermediate', false, true, 'barbell'),
  ('Romanian Deadlift', 'Lower barbell by pushing hips back, slight knee bend, feel stretch in hamstrings', 'Hamstrings', ARRAY['Glutes', 'Lower Back'], ARRAY['Barbell'], 'Hinge', 'intermediate', false, false, 'barbell'),
  ('Sumo Deadlift', 'Wide stance, toes out, grip between legs, drive knees out as you stand', 'Glutes', ARRAY['Hamstrings', 'Adductors', 'Traps'], ARRAY['Barbell'], 'Hinge', 'intermediate', false, false, 'barbell'),
  ('Trap Bar Deadlift', 'Stand inside trap bar, grip handles, drive through heels to stand', 'Hamstrings', ARRAY['Glutes', 'Traps', 'Quadriceps'], ARRAY['Trap Bar'], 'Hinge', 'beginner', false, false, 'other'),
  ('Single Leg Deadlift', 'Balance on one leg, hinge forward extending other leg back', 'Hamstrings', ARRAY['Glutes', 'Core', 'Balance'], ARRAY['Dumbbells (optional)'], 'Hinge', 'intermediate', true, false, 'dumbbell'),
  ('Good Morning', 'Barbell on back, hinge at hips keeping back straight, feel hamstring stretch', 'Hamstrings', ARRAY['Lower Back', 'Glutes'], ARRAY['Barbell'], 'Hinge', 'intermediate', false, false, 'barbell'),
  ('Barbell Hip Thrust', 'Upper back on bench, barbell over hips, drive hips up squeezing glutes', 'Glutes', ARRAY['Hamstrings'], ARRAY['Barbell', 'Bench'], 'Hip Extension', 'intermediate', false, false, 'barbell'),
  ('Glute Bridge', 'Lie on back, feet flat, drive hips up squeezing glutes at top', 'Glutes', ARRAY['Hamstrings', 'Core'], ARRAY[]::text[], 'Hip Extension', 'beginner', true, false, 'bodyweight'),
  ('Walking Lunge', 'Step forward into lunge, drive through front heel to next step', 'Quadriceps', ARRAY['Glutes', 'Balance'], ARRAY['Dumbbells (optional)'], 'Lunge', 'beginner', true, false, 'dumbbell'),
  ('Reverse Lunge', 'Step back into lunge, push through front heel to return', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], ARRAY['Dumbbells (optional)'], 'Lunge', 'beginner', true, false, 'dumbbell'),
  ('Leg Curl', 'Lie prone on machine, curl heels toward glutes', 'Hamstrings', ARRAY[]::text[], ARRAY['Leg Curl Machine'], 'Knee Flexion', 'beginner', false, false, 'machine'),
  ('Leg Extension', 'Sit in machine, extend legs against resistance', 'Quadriceps', ARRAY[]::text[], ARRAY['Leg Extension Machine'], 'Knee Extension', 'beginner', false, false, 'machine'),
  ('Calf Raise', 'Stand on edge, raise heels as high as possible, lower with control', 'Calves', ARRAY[]::text[], ARRAY[]::text[], 'Calf Raise', 'beginner', true, false, 'bodyweight'),
  ('Barbell Bench Press', 'Lie on bench, lower barbell to chest, press up to full extension', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY['Barbell', 'Bench'], 'Horizontal Push', 'intermediate', false, true, 'barbell'),
  ('Incline Barbell Bench Press', 'On incline bench, press barbell from upper chest', 'Upper Chest', ARRAY['Shoulders', 'Triceps'], ARRAY['Barbell', 'Incline Bench'], 'Incline Push', 'intermediate', false, false, 'barbell'),
  ('Decline Barbell Bench Press', 'On decline bench, press barbell from lower chest', 'Lower Chest', ARRAY['Triceps'], ARRAY['Barbell', 'Decline Bench'], 'Decline Push', 'intermediate', false, false, 'barbell'),
  ('Dumbbell Bench Press', 'Lie on bench with dumbbells, press up from chest level', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY['Dumbbells', 'Bench'], 'Horizontal Push', 'beginner', false, false, 'dumbbell'),
  ('Incline Dumbbell Press', 'On incline bench, press dumbbells up from shoulders', 'Upper Chest', ARRAY['Shoulders', 'Triceps'], ARRAY['Dumbbells', 'Incline Bench'], 'Incline Push', 'beginner', false, false, 'dumbbell'),
  ('Dumbbell Fly', 'Lie on bench, lower dumbbells out to sides with slight bend in elbows', 'Chest', ARRAY['Shoulders'], ARRAY['Dumbbells', 'Bench'], 'Fly', 'beginner', false, false, 'dumbbell'),
  ('Incline Dumbbell Fly', 'On incline bench, lower dumbbells out to sides', 'Upper Chest', ARRAY['Shoulders'], ARRAY['Dumbbells', 'Incline Bench'], 'Fly', 'beginner', false, false, 'dumbbell'),
  ('Cable Fly', 'Stand between cable towers, bring handles together in front of chest', 'Chest', ARRAY['Shoulders'], ARRAY['Cable Machine'], 'Fly', 'beginner', false, false, 'cable'),
  ('Push-Up', 'Start in plank, lower chest to ground, push back up', 'Chest', ARRAY['Triceps', 'Shoulders', 'Core'], ARRAY[]::text[], 'Horizontal Push', 'beginner', true, false, 'bodyweight'),
  ('Incline Push-Up', 'Hands elevated on bench or box, perform push-up', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY['Bench'], 'Incline Push', 'beginner', true, false, 'bodyweight'),
  ('Decline Push-Up', 'Feet elevated on bench, perform push-up', 'Upper Chest', ARRAY['Shoulders', 'Triceps', 'Core'], ARRAY['Bench'], 'Decline Push', 'intermediate', true, false, 'bodyweight'),
  ('Chest Dip', 'On parallel bars, lean forward, lower and press back up', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY['Dip Bars'], 'Dip', 'intermediate', true, false, 'bodyweight'),
  ('Overhead Press', 'Press barbell from shoulders to overhead, keep core tight', 'Shoulders', ARRAY['Triceps', 'Upper Chest'], ARRAY['Barbell'], 'Vertical Push', 'intermediate', false, false, 'barbell'),
  ('Dumbbell Shoulder Press', 'Press dumbbells overhead from shoulder height', 'Shoulders', ARRAY['Triceps'], ARRAY['Dumbbells'], 'Vertical Push', 'beginner', false, false, 'dumbbell'),
  ('Seated Dumbbell Press', 'Sit on bench with back support, press dumbbells overhead', 'Shoulders', ARRAY['Triceps'], ARRAY['Dumbbells', 'Bench'], 'Vertical Push', 'beginner', false, false, 'dumbbell'),
  ('Arnold Press', 'Start with palms facing you, rotate as you press overhead', 'Shoulders', ARRAY['Triceps'], ARRAY['Dumbbells'], 'Vertical Push', 'intermediate', false, false, 'dumbbell'),
  ('Lateral Raise', 'Raise dumbbells out to sides until parallel with ground', 'Side Deltoids', ARRAY[]::text[], ARRAY['Dumbbells'], 'Lateral Raise', 'beginner', false, false, 'dumbbell'),
  ('Front Raise', 'Raise dumbbells in front of body to shoulder height', 'Front Deltoids', ARRAY[]::text[], ARRAY['Dumbbells'], 'Front Raise', 'beginner', false, false, 'dumbbell'),
  ('Bent Over Rear Delt Fly', 'Hinge forward, raise dumbbells out to sides focusing on rear delts', 'Rear Deltoids', ARRAY['Upper Back'], ARRAY['Dumbbells'], 'Rear Delt Fly', 'beginner', false, false, 'dumbbell'),
  ('Face Pull', 'Pull rope attachment to face, externally rotate shoulders', 'Rear Deltoids', ARRAY['Upper Back', 'Rotator Cuff'], ARRAY['Cable Machine', 'Rope'], 'Row', 'beginner', false, false, 'cable'),
  ('Upright Row', 'Pull barbell up along body to chin, elbows high', 'Shoulders', ARRAY['Traps'], ARRAY['Barbell'], 'Vertical Pull', 'intermediate', false, false, 'barbell'),
  ('Barbell Row', 'Hinge forward, pull barbell to lower chest, squeeze shoulder blades', 'Upper Back', ARRAY['Lats', 'Biceps'], ARRAY['Barbell'], 'Horizontal Pull', 'intermediate', false, false, 'barbell'),
  ('Pendlay Row', 'Barbell starts on ground each rep, explosive pull to chest', 'Upper Back', ARRAY['Lats', 'Lower Back'], ARRAY['Barbell'], 'Horizontal Pull', 'intermediate', false, false, 'barbell'),
  ('Dumbbell Row', 'One knee on bench, pull dumbbell to hip', 'Upper Back', ARRAY['Lats', 'Biceps'], ARRAY['Dumbbell', 'Bench'], 'Horizontal Pull', 'beginner', false, false, 'dumbbell'),
  ('Seated Cable Row', 'Sit upright, pull handle to torso, squeeze shoulder blades', 'Upper Back', ARRAY['Lats', 'Biceps'], ARRAY['Cable Machine'], 'Horizontal Pull', 'beginner', false, false, 'cable'),
  ('T-Bar Row', 'Straddle bar, pull to chest with narrow grip', 'Upper Back', ARRAY['Lats', 'Lower Back'], ARRAY['T-Bar Row'], 'Horizontal Pull', 'intermediate', false, false, 'other'),
  ('Chest Supported Row', 'Lie face down on incline bench, row dumbbells to sides', 'Upper Back', ARRAY['Biceps'], ARRAY['Incline Bench', 'Dumbbells'], 'Horizontal Pull', 'beginner', false, false, 'dumbbell'),
  ('Pull-Up', 'Hang from bar, pull chin over bar, lower with control', 'Lats', ARRAY['Biceps', 'Upper Back'], ARRAY['Pull-Up Bar'], 'Vertical Pull', 'intermediate', true, false, 'bodyweight'),
  ('Chin-Up', 'Underhand grip pull-up, more bicep involvement', 'Lats', ARRAY['Biceps'], ARRAY['Pull-Up Bar'], 'Vertical Pull', 'intermediate', true, false, 'bodyweight'),
  ('Assisted Pull-Up', 'Pull-up with machine assistance or resistance band', 'Lats', ARRAY['Biceps', 'Upper Back'], ARRAY['Assisted Pull-Up Machine'], 'Vertical Pull', 'beginner', false, false, 'machine'),
  ('Lat Pulldown', 'Pull bar down to upper chest, lean back slightly', 'Lats', ARRAY['Biceps', 'Upper Back'], ARRAY['Lat Pulldown Machine'], 'Vertical Pull', 'beginner', false, false, 'machine'),
  ('Close Grip Lat Pulldown', 'Narrow grip, pull to upper chest', 'Lats', ARRAY['Biceps', 'Middle Back'], ARRAY['Lat Pulldown Machine'], 'Vertical Pull', 'beginner', false, false, 'machine'),
  ('Straight Arm Pulldown', 'Keep arms straight, pull bar down to thighs', 'Lats', ARRAY[]::text[], ARRAY['Cable Machine'], 'Lat Extension', 'beginner', false, false, 'cable'),
  ('Inverted Row', 'Hang under bar at waist height, pull chest to bar', 'Upper Back', ARRAY['Lats', 'Biceps'], ARRAY['Smith Machine or Rings'], 'Horizontal Pull', 'beginner', true, false, 'machine'),
  ('Shrug', 'Hold dumbbells or barbell, raise shoulders toward ears', 'Traps', ARRAY[]::text[], ARRAY['Dumbbells or Barbell'], 'Shrug', 'beginner', false, false, 'barbell'),
  ('Barbell Curl', 'Curl barbell from thighs to shoulders, squeeze biceps', 'Biceps', ARRAY['Forearms'], ARRAY['Barbell'], 'Curl', 'beginner', false, false, 'barbell'),
  ('Dumbbell Curl', 'Curl dumbbells from sides to shoulders, alternate or together', 'Biceps', ARRAY['Forearms'], ARRAY['Dumbbells'], 'Curl', 'beginner', false, false, 'dumbbell'),
  ('Hammer Curl', 'Curl with palms facing each other, targets brachialis', 'Biceps', ARRAY['Brachialis', 'Forearms'], ARRAY['Dumbbells'], 'Curl', 'beginner', false, false, 'dumbbell'),
  ('Preacher Curl', 'Arms resting on preacher bench, curl weight', 'Biceps', ARRAY[]::text[], ARRAY['Preacher Bench', 'Dumbbells or Barbell'], 'Curl', 'beginner', false, false, 'barbell'),
  ('Cable Curl', 'Stand at cable machine, curl handle to shoulders', 'Biceps', ARRAY['Forearms'], ARRAY['Cable Machine'], 'Curl', 'beginner', false, false, 'cable'),
  ('Concentration Curl', 'Sit, brace elbow on thigh, curl dumbbell', 'Biceps', ARRAY[]::text[], ARRAY['Dumbbell', 'Bench'], 'Curl', 'beginner', false, false, 'dumbbell'),
  ('Close Grip Bench Press', 'Bench press with narrow grip, elbows tucked', 'Triceps', ARRAY['Chest', 'Shoulders'], ARRAY['Barbell', 'Bench'], 'Horizontal Push', 'intermediate', false, false, 'barbell'),
  ('Tricep Dip', 'On parallel bars, keep torso upright, lower and press', 'Triceps', ARRAY['Chest', 'Shoulders'], ARRAY['Dip Bars'], 'Dip', 'intermediate', true, false, 'bodyweight'),
  ('Bench Dip', 'Hands on bench behind, feet forward, dip down', 'Triceps', ARRAY['Shoulders'], ARRAY['Bench'], 'Dip', 'beginner', true, false, 'bodyweight'),
  ('Overhead Tricep Extension', 'Hold dumbbell overhead, lower behind head, extend up', 'Triceps', ARRAY[]::text[], ARRAY['Dumbbell'], 'Extension', 'beginner', false, false, 'dumbbell'),
  ('Skull Crusher', 'Lie on bench, lower bar to forehead, extend back up', 'Triceps', ARRAY[]::text[], ARRAY['Barbell or EZ Bar', 'Bench'], 'Extension', 'intermediate', false, false, 'barbell'),
  ('Cable Tricep Pushdown', 'Push cable attachment down, squeeze triceps', 'Triceps', ARRAY[]::text[], ARRAY['Cable Machine'], 'Extension', 'beginner', false, false, 'cable'),
  ('Rope Tricep Pushdown', 'Push rope down and apart, squeeze at bottom', 'Triceps', ARRAY[]::text[], ARRAY['Cable Machine', 'Rope'], 'Extension', 'beginner', false, false, 'cable'),
  ('Kickback', 'Hinge forward, extend dumbbell back keeping upper arm still', 'Triceps', ARRAY[]::text[], ARRAY['Dumbbell'], 'Extension', 'beginner', false, false, 'dumbbell'),
  ('Diamond Push-Up', 'Push-up with hands forming diamond shape, elbows tucked', 'Triceps', ARRAY['Chest'], ARRAY[]::text[], 'Horizontal Push', 'intermediate', true, false, 'bodyweight'),
  ('Plank', 'Hold forearm plank position, keep body straight', 'Core', ARRAY['Shoulders'], ARRAY[]::text[], 'Isometric', 'beginner', true, false, 'bodyweight'),
  ('Side Plank', 'Support body on one forearm, hold body straight', 'Obliques', ARRAY['Core'], ARRAY[]::text[], 'Isometric', 'beginner', true, false, 'bodyweight'),
  ('Dead Bug', 'Lie on back, extend opposite arm and leg, alternate', 'Core', ARRAY[]::text[], ARRAY[]::text[], 'Anti-Extension', 'beginner', true, false, 'bodyweight'),
  ('Bird Dog', 'On all fours, extend opposite arm and leg', 'Core', ARRAY['Lower Back', 'Glutes'], ARRAY[]::text[], 'Anti-Rotation', 'beginner', true, false, 'bodyweight'),
  ('Russian Twist', 'Sit with feet off ground, twist torso side to side', 'Obliques', ARRAY['Core'], ARRAY[]::text[], 'Rotation', 'beginner', true, false, 'bodyweight'),
  ('Cable Woodchop', 'Pull cable diagonally across body in chopping motion', 'Obliques', ARRAY['Core'], ARRAY['Cable Machine'], 'Rotation', 'beginner', false, false, 'cable'),
  ('Pallof Press', 'Hold cable at chest, press out resisting rotation', 'Core', ARRAY['Obliques'], ARRAY['Cable Machine'], 'Anti-Rotation', 'beginner', false, false, 'cable'),
  ('Ab Wheel Rollout', 'Kneel with ab wheel, roll out and back', 'Core', ARRAY['Shoulders', 'Lower Back'], ARRAY['Ab Wheel'], 'Anti-Extension', 'intermediate', true, false, 'bodyweight'),
  ('Hanging Leg Raise', 'Hang from bar, raise legs to horizontal', 'Core', ARRAY['Hip Flexors'], ARRAY['Pull-Up Bar'], 'Flexion', 'intermediate', true, false, 'bodyweight'),
  ('Hanging Knee Raise', 'Hang from bar, bring knees to chest', 'Core', ARRAY['Hip Flexors'], ARRAY['Pull-Up Bar'], 'Flexion', 'beginner', true, false, 'bodyweight'),
  ('Crunch', 'Lie on back, curl shoulders off ground', 'Core', ARRAY[]::text[], ARRAY[]::text[], 'Flexion', 'beginner', true, false, 'bodyweight'),
  ('Bicycle Crunch', 'Alternate bringing elbow to opposite knee', 'Core', ARRAY['Obliques'], ARRAY[]::text[], 'Rotation', 'beginner', true, false, 'bodyweight'),
  ('Mountain Climber', 'Plank position, drive knees to chest alternately', 'Core', ARRAY['Shoulders', 'Cardio'], ARRAY[]::text[], 'Dynamic', 'intermediate', true, false, 'bodyweight'),
  ('Farmer''s Walk', 'Hold heavy weight in each hand, walk with good posture', 'Forearms', ARRAY['Core', 'Traps', 'Grip'], ARRAY['Dumbbells or Kettlebells'], 'Carry', 'beginner', false, false, 'kettlebell'),
  ('Suitcase Carry', 'Hold weight on one side, walk maintaining straight posture', 'Core', ARRAY['Obliques', 'Forearms'], ARRAY['Dumbbell or Kettlebell'], 'Carry', 'beginner', false, false, 'kettlebell'),
  ('Wrist Curl', 'Forearms on thighs, curl wrists up', 'Forearms', ARRAY[]::text[], ARRAY['Dumbbells'], 'Flexion', 'beginner', false, false, 'dumbbell'),
  ('Reverse Wrist Curl', 'Forearms on thighs, palms down, extend wrists up', 'Forearms', ARRAY[]::text[], ARRAY['Dumbbells'], 'Extension', 'beginner', false, false, 'dumbbell'),
  ('Burpee', 'Drop to plank, push-up, jump feet to hands, jump up', 'Full Body', ARRAY['Cardio', 'Core'], ARRAY[]::text[], 'Dynamic', 'intermediate', true, false, 'bodyweight'),
  ('Box Jump', 'Jump onto box or platform, step down', 'Quadriceps', ARRAY['Glutes', 'Power', 'Cardio'], ARRAY['Plyo Box'], 'Jump', 'intermediate', true, false, 'bodyweight'),
  ('Kettlebell Swing', 'Hinge and swing kettlebell between legs, drive hips forward', 'Glutes', ARRAY['Hamstrings', 'Core', 'Power'], ARRAY['Kettlebell'], 'Hinge', 'intermediate', false, false, 'kettlebell'),
  ('Turkish Get-Up', 'Complex movement from lying to standing with weight overhead', 'Full Body', ARRAY['Core', 'Shoulders'], ARRAY['Kettlebell or Dumbbell'], 'Complex', 'advanced', false, false, 'kettlebell'),
  ('Battle Ropes', 'Alternate or simultaneous waves with heavy ropes', 'Shoulders', ARRAY['Core', 'Cardio'], ARRAY['Battle Ropes'], 'Dynamic', 'intermediate', false, false, 'other'),
  ('Sled Push', 'Push weighted sled across floor', 'Quadriceps', ARRAY['Glutes', 'Calves', 'Power'], ARRAY['Prowler Sled'], 'Push', 'intermediate', false, false, 'other'),
  ('Sled Pull', 'Pull weighted sled with rope or harness', 'Upper Back', ARRAY['Hamstrings', 'Glutes'], ARRAY['Prowler Sled', 'Rope'], 'Pull', 'intermediate', false, false, 'other'),
  ('Wall Ball', 'Squat and throw medicine ball up to target on wall', 'Quadriceps', ARRAY['Shoulders', 'Power'], ARRAY['Medicine Ball'], 'Squat', 'beginner', false, false, 'other'),
  ('Medicine Ball Slam', 'Raise ball overhead, slam down forcefully', 'Core', ARRAY['Shoulders', 'Power'], ARRAY['Medicine Ball'], 'Slam', 'beginner', false, false, 'other'),
  ('Thruster', 'Front squat into overhead press in one motion', 'Full Body', ARRAY['Quadriceps', 'Shoulders'], ARRAY['Barbell or Dumbbells'], 'Complex', 'intermediate', false, false, 'barbell'),
  ('Clean and Press', 'Clean barbell to shoulders, then press overhead', 'Full Body', ARRAY['Shoulders', 'Power'], ARRAY['Barbell'], 'Complex', 'advanced', false, false, 'barbell'),
  ('Snatch', 'Explosive lift from ground to overhead in one motion', 'Full Body', ARRAY['Power', 'Coordination'], ARRAY['Barbell'], 'Olympic Lift', 'advanced', false, false, 'barbell'),
  ('Power Clean', 'Explosive pull to rack position at shoulders', 'Full Body', ARRAY['Power', 'Traps'], ARRAY['Barbell'], 'Olympic Lift', 'advanced', false, false, 'barbell'),
  ('Jump Squat', 'Squat down, explode into jump, land softly', 'Quadriceps', ARRAY['Glutes', 'Power', 'Calves'], ARRAY[]::text[], 'Jump', 'intermediate', true, false, 'bodyweight'),
  ('Broad Jump', 'Jump forward for distance, land in squat position', 'Quadriceps', ARRAY['Glutes', 'Calves', 'Power'], ARRAY[]::text[], 'Jump', 'intermediate', true, false, 'bodyweight'),
  ('Jumping Lunge', 'Lunge position, jump and switch legs in air', 'Quadriceps', ARRAY['Glutes', 'Power', 'Cardio'], ARRAY[]::text[], 'Jump', 'intermediate', true, false, 'bodyweight'),
  ('Treadmill Run', 'Steady state or interval running on treadmill', 'Cardio', ARRAY['Legs'], ARRAY['Treadmill'], 'Cardio', 'beginner', true, false, 'bodyweight'),
  ('Rowing Machine', 'Pull handle while driving through legs', 'Cardio', ARRAY['Back', 'Legs'], ARRAY['Rowing Machine'], 'Cardio', 'beginner', true, false, 'machine'),
  ('Assault Bike', 'Pedal with arms and legs for high-intensity cardio', 'Cardio', ARRAY['Full Body'], ARRAY['Assault Bike'], 'Cardio', 'intermediate', true, false, 'bodyweight'),
  ('Jump Rope', 'Jump over rotating rope', 'Cardio', ARRAY['Calves', 'Coordination'], ARRAY['Jump Rope'], 'Cardio', 'beginner', true, false, 'bodyweight'),
  ('Stair Climber', 'Continuous stepping motion on machine', 'Cardio', ARRAY['Glutes', 'Quadriceps'], ARRAY['Stair Climber'], 'Cardio', 'beginner', true, false, 'bodyweight')
ON CONFLICT DO NOTHING;
