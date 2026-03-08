-- 007_exercise_library_expansion.sql
-- Expands the exercise library with ~100 new exercises across all categories:
-- Bodyweight, Machine, Free Weight (Barbell/Dumbbell/Kettlebell), Cable, Cardio, Boxing

INSERT INTO public.exercises (name, description, primary_muscle_group, secondary_muscle_groups, equipment_required, movement_pattern, difficulty_level, is_bodyweight, is_locked, equipment_category, metric_type)
VALUES

  -- ═══════════════════════════════════════════════════════════════
  -- BODYWEIGHT — Upper Body
  -- ═══════════════════════════════════════════════════════════════
  ('Pike Push-Up',              'Start in downward dog, bend elbows to lower head toward ground, press up', 'Shoulders', ARRAY['Triceps', 'Upper Chest'], ARRAY[]::text[], 'Vertical Push', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Archer Push-Up',            'Widen hands, shift weight to one side as you lower, alternate sides', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY[]::text[], 'Horizontal Push', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Typewriter Push-Up',        'Lower chest to ground then slide sideways before pushing up on other side', 'Chest', ARRAY['Triceps', 'Core'], ARRAY[]::text[], 'Horizontal Push', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Pseudo Planche Push-Up',    'Hands by hips, lean forward before pushing up to train planche strength', 'Chest', ARRAY['Shoulders', 'Core'], ARRAY[]::text[], 'Horizontal Push', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Hindu Push-Up',             'Flow from downward dog through upward dog in one fluid motion', 'Shoulders', ARRAY['Chest', 'Core', 'Hip Flexors'], ARRAY[]::text[], 'Dynamic', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Wide Pull-Up',              'Pull-up with hands wider than shoulder width, emphasises lats', 'Lats', ARRAY['Biceps', 'Upper Back'], ARRAY['Pull-Up Bar'], 'Vertical Pull', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Neutral Grip Pull-Up',      'Pull-up with parallel handles, shoulder-friendly grip', 'Lats', ARRAY['Biceps', 'Upper Back'], ARRAY['Pull-Up Bar with Neutral Grips'], 'Vertical Pull', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('L-Sit',                     'Support on parallel bars or floor, hold legs straight and horizontal', 'Core', ARRAY['Hip Flexors', 'Triceps'], ARRAY['Parallel Bars'], 'Isometric', 'advanced', true, false, 'bodyweight', 'duration'),
  ('Muscle-Up',                 'Explosive pull-up transitioning into dip above the bar', 'Lats', ARRAY['Chest', 'Triceps', 'Core'], ARRAY['Pull-Up Bar'], 'Complex', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Scapular Pull-Up',          'Hang from bar, depress and retract shoulder blades without bending elbows', 'Upper Back', ARRAY['Lats', 'Serratus'], ARRAY['Pull-Up Bar'], 'Vertical Pull', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Scapular Push-Up',          'In plank, protract and retract shoulder blades without bending elbows', 'Serratus', ARRAY['Upper Back', 'Shoulders'], ARRAY[]::text[], 'Horizontal Push', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Ring Row',                  'Hang under gymnastics rings or TRX, pull chest up to handles', 'Upper Back', ARRAY['Lats', 'Biceps'], ARRAY['Gymnastics Rings or TRX'], 'Horizontal Pull', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Ring Push-Up',              'Push-up on gymnastics rings, adds instability and rotation', 'Chest', ARRAY['Triceps', 'Shoulders', 'Core'], ARRAY['Gymnastics Rings'], 'Horizontal Push', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Dip (Weighted)',            'Parallel bar dip with added weight via belt or vest', 'Triceps', ARRAY['Chest', 'Shoulders'], ARRAY['Dip Bars', 'Dip Belt'], 'Dip', 'advanced', false, false, 'bodyweight', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- BODYWEIGHT — Lower Body
  -- ═══════════════════════════════════════════════════════════════
  ('Pistol Squat',              'Single-leg squat all the way down, hold other leg straight in front', 'Quadriceps', ARRAY['Glutes', 'Balance', 'Core'], ARRAY[]::text[], 'Squat', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Sissy Squat',               'Lean back, push knees forward past toes, lower thighs toward ground', 'Quadriceps', ARRAY['Core', 'Balance'], ARRAY[]::text[], 'Squat', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Nordic Curl',               'Kneel with feet anchored, lower torso toward ground controlling the fall', 'Hamstrings', ARRAY['Glutes', 'Core'], ARRAY['Anchor Point'], 'Hinge', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Step-Up',                   'Step onto box or bench, drive through heel to stand on top', 'Quadriceps', ARRAY['Glutes', 'Balance'], ARRAY['Box or Bench'], 'Lunge', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Lateral Lunge',             'Step wide to side, sit into hip of the working leg, return', 'Quadriceps', ARRAY['Glutes', 'Adductors', 'Hamstrings'], ARRAY[]::text[], 'Lunge', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Curtsy Lunge',              'Step back and across the body into a curtsy position, return', 'Glutes', ARRAY['Quadriceps', 'Adductors'], ARRAY[]::text[], 'Lunge', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Hip Circle',                'On all fours, rotate knee in large circle to open hip', 'Glutes', ARRAY['Hip Flexors', 'Mobility'], ARRAY[]::text[], 'Mobility', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Donkey Kick',               'On all fours, drive heel toward ceiling, squeeze glute at top', 'Glutes', ARRAY['Hamstrings', 'Core'], ARRAY[]::text[], 'Hip Extension', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Fire Hydrant',              'On all fours, raise knee out to the side keeping 90° bend', 'Glutes', ARRAY['Hip Abductors'], ARRAY[]::text[], 'Hip Abduction', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Clamshell',                 'Lie on side, knees bent, open top knee like a clamshell', 'Glutes', ARRAY['Hip Abductors'], ARRAY[]::text[], 'Hip Abduction', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Wall Sit',                  'Hold squat position against wall, thighs parallel to ground', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], ARRAY[]::text[], 'Isometric', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Single Leg Calf Raise',     'Balance on one foot, raise heel as high as possible, lower with control', 'Calves', ARRAY[]::text[], ARRAY[]::text[], 'Calf Raise', 'beginner', true, false, 'bodyweight', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- BODYWEIGHT — Core
  -- ═══════════════════════════════════════════════════════════════
  ('V-Up',                      'Lie flat, simultaneously raise straight legs and torso to form a V', 'Core', ARRAY['Hip Flexors'], ARRAY[]::text[], 'Flexion', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Hollow Body Hold',          'Lie flat, press lower back into floor, raise shoulders and legs slightly', 'Core', ARRAY['Hip Flexors'], ARRAY[]::text[], 'Isometric', 'intermediate', true, false, 'bodyweight', 'duration'),
  ('Tuck Crunch',               'Lie on back, bring knees and elbows together simultaneously', 'Core', ARRAY['Hip Flexors'], ARRAY[]::text[], 'Flexion', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Toe Touch',                 'Lie flat with legs vertical, reach hands up toward feet', 'Core', ARRAY[]::text[], ARRAY[]::text[], 'Flexion', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Dragon Flag',               'Support on bench, keep body rigid and lower straight legs toward ground', 'Core', ARRAY['Hip Flexors', 'Lower Back'], ARRAY['Bench'], 'Anti-Extension', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Copenhagen Plank',          'Side plank with top foot on bench, hold or do hip raises', 'Adductors', ARRAY['Core', 'Glutes'], ARRAY['Bench'], 'Isometric', 'advanced', true, false, 'bodyweight', 'duration'),
  ('Windshield Wiper',          'Hang from bar, raise legs to horizontal then rotate side to side', 'Obliques', ARRAY['Core', 'Hip Flexors'], ARRAY['Pull-Up Bar'], 'Rotation', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Reverse Crunch',            'Lie on back, use core to curl hips up off ground toward chest', 'Core', ARRAY['Hip Flexors'], ARRAY[]::text[], 'Flexion', 'beginner', true, false, 'bodyweight', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- MACHINE — Isolation & Compound
  -- ═══════════════════════════════════════════════════════════════
  ('Chest Press Machine',       'Sit in machine, press handles forward to full extension', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY['Chest Press Machine'], 'Horizontal Push', 'beginner', false, false, 'machine', 'reps'),
  ('Pec Deck Fly',              'Sit in machine, bring padded arms together in front of chest', 'Chest', ARRAY['Front Deltoids'], ARRAY['Pec Deck Machine'], 'Fly', 'beginner', false, false, 'machine', 'reps'),
  ('Incline Chest Press Machine','Sit in incline machine, press handles at an upward angle', 'Upper Chest', ARRAY['Shoulders', 'Triceps'], ARRAY['Incline Chest Press Machine'], 'Incline Push', 'beginner', false, false, 'machine', 'reps'),
  ('Machine Shoulder Press',    'Sit in machine, press handles straight overhead', 'Shoulders', ARRAY['Triceps'], ARRAY['Shoulder Press Machine'], 'Vertical Push', 'beginner', false, false, 'machine', 'reps'),
  ('Machine Lateral Raise',     'Sit in machine, raise arms out to sides against resistance', 'Side Deltoids', ARRAY[]::text[], ARRAY['Lateral Raise Machine'], 'Lateral Raise', 'beginner', false, false, 'machine', 'reps'),
  ('Machine Rear Delt Fly',     'Sit facing pad, reverse fly motion targeting rear deltoids', 'Rear Deltoids', ARRAY['Upper Back'], ARRAY['Pec Deck Machine'], 'Rear Delt Fly', 'beginner', false, false, 'machine', 'reps'),
  ('Machine Row',               'Sit in machine, pull handles toward torso, squeeze shoulder blades', 'Upper Back', ARRAY['Biceps', 'Lats'], ARRAY['Machine Row'], 'Horizontal Pull', 'beginner', false, false, 'machine', 'reps'),
  ('Machine Bicep Curl',        'Sit with upper arms on pad, curl handles up to shoulders', 'Biceps', ARRAY['Forearms'], ARRAY['Bicep Curl Machine'], 'Curl', 'beginner', false, false, 'machine', 'reps'),
  ('Machine Tricep Extension',  'Sit with upper arms on pad, extend handles downward', 'Triceps', ARRAY[]::text[], ARRAY['Tricep Machine'], 'Extension', 'beginner', false, false, 'machine', 'reps'),
  ('Hip Abduction Machine',     'Sit in machine, push legs outward against resistance', 'Glutes', ARRAY['Hip Abductors'], ARRAY['Hip Abduction Machine'], 'Hip Abduction', 'beginner', false, false, 'machine', 'reps'),
  ('Hip Adduction Machine',     'Sit in machine, squeeze legs inward against resistance', 'Adductors', ARRAY[]::text[], ARRAY['Hip Adduction Machine'], 'Hip Adduction', 'beginner', false, false, 'machine', 'reps'),
  ('Seated Calf Raise Machine', 'Sit with pads on thighs, raise heels through full range of motion', 'Calves', ARRAY[]::text[], ARRAY['Seated Calf Raise Machine'], 'Calf Raise', 'beginner', false, false, 'machine', 'reps'),
  ('Standing Calf Raise Machine','Stand in machine with pads on shoulders, raise heels', 'Calves', ARRAY[]::text[], ARRAY['Standing Calf Raise Machine'], 'Calf Raise', 'beginner', false, false, 'machine', 'reps'),
  ('Smith Machine Squat',       'Barbell on fixed track, squat with feet slightly in front', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], ARRAY['Smith Machine'], 'Squat', 'beginner', false, false, 'machine', 'reps'),
  ('Smith Machine Bench Press', 'Fixed bar path bench press, good for beginners or solo training', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY['Smith Machine', 'Bench'], 'Horizontal Push', 'beginner', false, false, 'machine', 'reps'),
  ('Smith Machine Overhead Press','Fixed bar path overhead press for shoulder safety', 'Shoulders', ARRAY['Triceps'], ARRAY['Smith Machine'], 'Vertical Push', 'beginner', false, false, 'machine', 'reps'),
  ('Cable Crossover',           'High cables, bring handles down and together crossing at chest height', 'Chest', ARRAY['Front Deltoids'], ARRAY['Cable Machine'], 'Fly', 'beginner', false, false, 'cable', 'reps'),
  ('Low Cable Fly',             'Low cable attachment, bring handles up and together in front of chest', 'Upper Chest', ARRAY['Front Deltoids'], ARRAY['Cable Machine'], 'Fly', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Lateral Raise',       'Cable at hip height, raise arm out to side to shoulder level', 'Side Deltoids', ARRAY[]::text[], ARRAY['Cable Machine'], 'Lateral Raise', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Front Raise',         'Cable at floor, raise arm forward to shoulder height', 'Front Deltoids', ARRAY[]::text[], ARRAY['Cable Machine'], 'Front Raise', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Upright Row',         'Cable at floor, pull bar up along body to chin height', 'Shoulders', ARRAY['Traps', 'Upper Back'], ARRAY['Cable Machine'], 'Vertical Pull', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Pull-Through',        'Stand facing away from cable, reach between legs and drive hips forward', 'Glutes', ARRAY['Hamstrings', 'Lower Back'], ARRAY['Cable Machine'], 'Hip Extension', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Kickback',            'Attach ankle cuff, drive leg back and up squeezing glute', 'Glutes', ARRAY['Hamstrings'], ARRAY['Cable Machine', 'Ankle Cuff'], 'Hip Extension', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Hip Abduction',       'Attach ankle cuff, raise leg out to side against resistance', 'Glutes', ARRAY['Hip Abductors'], ARRAY['Cable Machine', 'Ankle Cuff'], 'Hip Abduction', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Crunch',              'Kneel facing high cable, pull rope down crunching abs', 'Core', ARRAY['Obliques'], ARRAY['Cable Machine', 'Rope'], 'Flexion', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Oblique Crunch',      'Stand side-on to cable, pull handle down crunching oblique', 'Obliques', ARRAY['Core'], ARRAY['Cable Machine'], 'Flexion', 'beginner', false, false, 'cable', 'reps'),
  ('Cable Row (Single Arm)',    'One arm row on cable machine, rotate torso for full range of motion', 'Upper Back', ARRAY['Biceps', 'Core'], ARRAY['Cable Machine'], 'Horizontal Pull', 'beginner', false, false, 'cable', 'reps'),
  ('Tricep Cable Overhead Extension','Hold rope overhead from high cable, extend arms overhead', 'Triceps', ARRAY[]::text[], ARRAY['Cable Machine', 'Rope'], 'Extension', 'beginner', false, false, 'cable', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- BARBELL — Compound & Accessory
  -- ═══════════════════════════════════════════════════════════════
  ('Barbell Lunge',             'Step forward with barbell on back, lower rear knee toward floor', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], ARRAY['Barbell', 'Squat Rack'], 'Lunge', 'intermediate', false, false, 'barbell', 'reps'),
  ('Barbell Step-Up',           'Hold barbell on back, step onto box, stand tall, step down', 'Quadriceps', ARRAY['Glutes', 'Balance'], ARRAY['Barbell', 'Box'], 'Lunge', 'intermediate', false, false, 'barbell', 'reps'),
  ('Barbell Glute Bridge',      'Lie on back, barbell over hips, bridge up — feet on floor', 'Glutes', ARRAY['Hamstrings', 'Core'], ARRAY['Barbell'], 'Hip Extension', 'beginner', false, false, 'barbell', 'reps'),
  ('Pause Squat',               'Barbell back squat with 2-3 second pause at the bottom', 'Quadriceps', ARRAY['Glutes', 'Core'], ARRAY['Barbell', 'Squat Rack'], 'Squat', 'advanced', false, false, 'barbell', 'reps'),
  ('Box Squat',                 'Sit back onto box at parallel, pause, then drive up', 'Quadriceps', ARRAY['Glutes', 'Hamstrings'], ARRAY['Barbell', 'Squat Rack', 'Box'], 'Squat', 'intermediate', false, false, 'barbell', 'reps'),
  ('Jefferson Curl',            'With weight hanging, roll spine down vertebra by vertebra into full flexion', 'Lower Back', ARRAY['Hamstrings', 'Spinal Erectors'], ARRAY['Barbell or Dumbbells'], 'Hinge', 'advanced', false, false, 'barbell', 'reps'),
  ('Yates Row',                 'Underhand grip barbell row with slight torso lean, pull to belly button', 'Upper Back', ARRAY['Biceps', 'Lats'], ARRAY['Barbell'], 'Horizontal Pull', 'intermediate', false, false, 'barbell', 'reps'),
  ('Behind-the-Neck Press',     'Press barbell from behind neck to overhead, requires good shoulder mobility', 'Shoulders', ARRAY['Triceps', 'Upper Back'], ARRAY['Barbell', 'Squat Rack'], 'Vertical Push', 'advanced', false, false, 'barbell', 'reps'),
  ('Landmine Press',            'Press barbell anchored in landmine attachment at a diagonal angle', 'Shoulders', ARRAY['Chest', 'Triceps'], ARRAY['Barbell', 'Landmine Attachment'], 'Incline Push', 'intermediate', false, false, 'barbell', 'reps'),
  ('Landmine Row',              'Hold landmine bar and row it toward hip in hinged position', 'Upper Back', ARRAY['Biceps', 'Core'], ARRAY['Barbell', 'Landmine Attachment'], 'Horizontal Pull', 'intermediate', false, false, 'barbell', 'reps'),
  ('Zercher Squat',             'Bar held in crooks of elbows, squat maintaining upright torso', 'Quadriceps', ARRAY['Core', 'Glutes', 'Upper Back'], ARRAY['Barbell'], 'Squat', 'advanced', false, false, 'barbell', 'reps'),
  ('EZ Bar Curl',               'Curl EZ bar with angled grip, reduces wrist strain', 'Biceps', ARRAY['Forearms'], ARRAY['EZ Bar'], 'Curl', 'beginner', false, false, 'barbell', 'reps'),
  ('EZ Bar Skull Crusher',      'Skull crusher using EZ bar for easier wrist position', 'Triceps', ARRAY[]::text[], ARRAY['EZ Bar', 'Bench'], 'Extension', 'intermediate', false, false, 'barbell', 'reps'),
  ('Floor Press',               'Lie on floor, press barbell, triceps rest between reps', 'Chest', ARRAY['Triceps', 'Shoulders'], ARRAY['Barbell'], 'Horizontal Push', 'intermediate', false, false, 'barbell', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- DUMBBELL — Accessory & Isolation
  -- ═══════════════════════════════════════════════════════════════
  ('Dumbbell Romanian Deadlift','Hold dumbbells in front of thighs, hinge hips back, feel hamstring stretch', 'Hamstrings', ARRAY['Glutes', 'Lower Back'], ARRAY['Dumbbells'], 'Hinge', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Dumbbell Hip Thrust',       'Upper back on bench, dumbbell over hips, drive hips up', 'Glutes', ARRAY['Hamstrings'], ARRAY['Dumbbells', 'Bench'], 'Hip Extension', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Dumbbell Step-Up',          'Hold dumbbells at sides, step onto box, stand, step down', 'Quadriceps', ARRAY['Glutes', 'Balance'], ARRAY['Dumbbells', 'Box'], 'Lunge', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Dumbbell Lateral Lunge',    'Hold dumbbell at chest, step wide laterally, sit into hip', 'Quadriceps', ARRAY['Glutes', 'Adductors'], ARRAY['Dumbbell'], 'Lunge', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Dumbbell Front Squat',      'Hold dumbbells at shoulder height, squat with upright torso', 'Quadriceps', ARRAY['Core', 'Glutes'], ARRAY['Dumbbells'], 'Squat', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Dumbbell Overhead Tricep Extension (Both Arms)', 'Both hands grip one dumbbell overhead, lower behind head, extend up', 'Triceps', ARRAY[]::text[], ARRAY['Dumbbell'], 'Extension', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Single Arm Tricep Kickback','One dumbbell, hinge forward, extend arm back and squeeze tricep', 'Triceps', ARRAY[]::text[], ARRAY['Dumbbell'], 'Extension', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Incline Dumbbell Curl',     'Sit on incline bench, curl dumbbells from fully stretched position', 'Biceps', ARRAY['Forearms'], ARRAY['Dumbbells', 'Incline Bench'], 'Curl', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Zottman Curl',              'Curl up with supinated grip, rotate to pronated grip, lower slowly', 'Biceps', ARRAY['Brachialis', 'Forearms'], ARRAY['Dumbbells'], 'Curl', 'intermediate', false, false, 'dumbbell', 'reps'),
  ('Dumbbell Pullover',         'Lie on bench, hold dumbbell overhead, arc behind head and return', 'Lats', ARRAY['Chest', 'Triceps', 'Serratus'], ARRAY['Dumbbell', 'Bench'], 'Lat Extension', 'intermediate', false, false, 'dumbbell', 'reps'),
  ('Dumbbell Shrug',            'Hold dumbbells at sides, elevate shoulders toward ears', 'Traps', ARRAY[]::text[], ARRAY['Dumbbells'], 'Shrug', 'beginner', false, false, 'dumbbell', 'reps'),
  ('Cuban Press',               'Upright row to 90°, externally rotate, press overhead — shoulder rehab', 'Rear Deltoids', ARRAY['Rotator Cuff', 'Shoulders'], ARRAY['Dumbbells'], 'Complex', 'intermediate', false, false, 'dumbbell', 'reps'),
  ('Dumbbell Sumo Squat',       'Wide stance holding one dumbbell between legs, squat deep', 'Glutes', ARRAY['Adductors', 'Quadriceps'], ARRAY['Dumbbell'], 'Squat', 'beginner', false, false, 'dumbbell', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- KETTLEBELL
  -- ═══════════════════════════════════════════════════════════════
  ('Kettlebell Goblet Squat',   'Hold kettlebell at chest by horns, squat deep with elbows inside knees', 'Quadriceps', ARRAY['Glutes', 'Core'], ARRAY['Kettlebell'], 'Squat', 'beginner', false, false, 'kettlebell', 'reps'),
  ('Kettlebell Clean',          'Swing kettlebell and rack it at shoulder, hips drive movement', 'Full Body', ARRAY['Shoulders', 'Core', 'Power'], ARRAY['Kettlebell'], 'Olympic Lift', 'intermediate', false, false, 'kettlebell', 'reps'),
  ('Kettlebell Snatch',         'Swing kettlebell overhead in one fluid motion from between legs', 'Full Body', ARRAY['Shoulders', 'Core', 'Power'], ARRAY['Kettlebell'], 'Olympic Lift', 'advanced', false, false, 'kettlebell', 'reps'),
  ('Kettlebell Press',          'Press kettlebell from rack position to overhead', 'Shoulders', ARRAY['Triceps', 'Core'], ARRAY['Kettlebell'], 'Vertical Push', 'intermediate', false, false, 'kettlebell', 'reps'),
  ('Kettlebell Row',            'Hinge forward, row kettlebell to hip from floor', 'Upper Back', ARRAY['Biceps', 'Core'], ARRAY['Kettlebell'], 'Horizontal Pull', 'beginner', false, false, 'kettlebell', 'reps'),
  ('Kettlebell Windmill',       'Press kettlebell overhead, hinge to one side reaching floor with other hand', 'Obliques', ARRAY['Shoulders', 'Hamstrings', 'Core'], ARRAY['Kettlebell'], 'Rotation', 'advanced', false, false, 'kettlebell', 'reps'),
  ('Kettlebell Halo',           'Circle kettlebell around head maintaining tight core', 'Shoulders', ARRAY['Core', 'Upper Back'], ARRAY['Kettlebell'], 'Mobility', 'beginner', false, false, 'kettlebell', 'reps'),
  ('Kettlebell Deadlift',       'Kettlebell between feet, hip hinge to stand tall — great beginner hinge', 'Hamstrings', ARRAY['Glutes', 'Lower Back'], ARRAY['Kettlebell'], 'Hinge', 'beginner', false, false, 'kettlebell', 'reps'),
  ('Double Kettlebell Front Squat','Two kettlebells in rack position, squat maintaining upright torso', 'Quadriceps', ARRAY['Core', 'Glutes', 'Upper Back'], ARRAY['Kettlebells'], 'Squat', 'advanced', false, false, 'kettlebell', 'reps'),
  ('Kettlebell Around the World','Pass kettlebell around body in a circle, alternating directions', 'Core', ARRAY['Shoulders', 'Grip'], ARRAY['Kettlebell'], 'Dynamic', 'beginner', false, false, 'kettlebell', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- CARDIO / CONDITIONING
  -- ═══════════════════════════════════════════════════════════════
  ('Sprint',                    'Maximum effort run for short distance — 10 to 100 metres', 'Cardio', ARRAY['Legs', 'Glutes', 'Power'], ARRAY[]::text[], 'Cardio', 'intermediate', true, false, 'bodyweight', 'distance'),
  ('Hill Sprint',               'Maximum effort sprint up a hill, walk back down for recovery', 'Cardio', ARRAY['Glutes', 'Hamstrings', 'Calves', 'Power'], ARRAY[]::text[], 'Cardio', 'intermediate', true, false, 'bodyweight', 'distance'),
  ('Cycling',                   'Steady or interval pedalling on road or stationary bike', 'Cardio', ARRAY['Quadriceps', 'Glutes'], ARRAY['Bicycle or Stationary Bike'], 'Cardio', 'beginner', false, false, 'machine', 'duration'),
  ('Swimming Laps',             'Continuous lap swimming in pool', 'Cardio', ARRAY['Full Body', 'Shoulders', 'Core'], ARRAY['Pool'], 'Cardio', 'beginner', true, false, 'other', 'distance'),
  ('Elliptical Trainer',        'Low-impact cardio on elliptical machine', 'Cardio', ARRAY['Legs', 'Arms'], ARRAY['Elliptical Machine'], 'Cardio', 'beginner', false, false, 'machine', 'duration'),
  ('Stationary Bike Intervals', 'High-intensity cycling intervals on stationary bike', 'Cardio', ARRAY['Quadriceps', 'Glutes'], ARRAY['Stationary Bike'], 'Cardio', 'intermediate', false, false, 'machine', 'duration'),
  ('Ski Erg',                   'Pull handles down in double-pole motion targeting lats and conditioning', 'Cardio', ARRAY['Lats', 'Core', 'Shoulders'], ARRAY['Ski Erg Machine'], 'Cardio', 'intermediate', false, false, 'machine', 'duration'),
  ('High Knees',                'Run in place driving knees up to hip height at speed', 'Cardio', ARRAY['Hip Flexors', 'Calves'], ARRAY[]::text[], 'Cardio', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Butt Kicks',                'Run in place kicking heels up toward glutes at speed', 'Cardio', ARRAY['Hamstrings', 'Calves'], ARRAY[]::text[], 'Cardio', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Star Jump',                 'Jump feet wide while raising arms overhead, return — like a jumping jack', 'Cardio', ARRAY['Glutes', 'Shoulders'], ARRAY[]::text[], 'Dynamic', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Skater Jump',               'Lateral bound from one foot to the other like a speed skater', 'Glutes', ARRAY['Abductors', 'Balance', 'Cardio'], ARRAY[]::text[], 'Jump', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Bear Crawl',                'On hands and feet with knees hovering an inch off the ground, crawl forward', 'Core', ARRAY['Shoulders', 'Quadriceps', 'Cardio'], ARRAY[]::text[], 'Dynamic', 'intermediate', true, false, 'bodyweight', 'duration'),
  ('Duck Walk',                 'Stay in squat position and walk forward on feet', 'Quadriceps', ARRAY['Glutes', 'Balance'], ARRAY[]::text[], 'Dynamic', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Tuck Jump',                 'Jump and pull knees to chest at height of jump', 'Cardio', ARRAY['Quadriceps', 'Core', 'Power'], ARRAY[]::text[], 'Jump', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Depth Jump',                'Step off box, land and immediately explode into maximum jump', 'Quadriceps', ARRAY['Glutes', 'Calves', 'Power'], ARRAY['Plyo Box'], 'Jump', 'advanced', true, false, 'bodyweight', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- BOXING — Additional Drills & Strength
  -- ═══════════════════════════════════════════════════════════════
  ('Double-End Bag Drill',      'Hit small bag attached to floor and ceiling at eye level, trains accuracy and timing', 'Shoulders', ARRAY['Reaction', 'Coordination'], ARRAY['Double-End Bag'], 'Dynamic', 'intermediate', false, false, 'other', 'duration'),
  ('Speed Bag',                 'Hit hanging speed bag in circular rhythm, trains hand speed and timing', 'Shoulders', ARRAY['Forearms', 'Coordination'], ARRAY['Speed Bag'], 'Dynamic', 'beginner', false, false, 'other', 'duration'),
  ('Uppercut Bag Drill',        'Drive uppercuts into vertical heavy bag targeting uppercut technique', 'Shoulders', ARRAY['Core', 'Legs'], ARRAY['Heavy Bag'], 'Dynamic', 'beginner', false, false, 'other', 'duration'),
  ('Plyometric Push-Up',        'Explosive push-up where hands leave the ground, clap optional', 'Chest', ARRAY['Triceps', 'Shoulders', 'Power'], ARRAY[]::text[], 'Horizontal Push', 'advanced', true, false, 'bodyweight', 'reps'),
  ('Boxer Shuffle',             'Rapid weight transfer side to side in boxing stance, trains footwork agility', 'Calves', ARRAY['Agility', 'Cardio'], ARRAY[]::text[], 'Dynamic', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Resistance Band Punch',     'Anchor band behind, throw punches against resistance to build punching power', 'Shoulders', ARRAY['Triceps', 'Core'], ARRAY['Resistance Band'], 'Dynamic', 'intermediate', false, false, 'other', 'reps'),
  ('Medicine Ball Rotational Throw','Stand sideways to wall, rotate and throw ball explosively against wall', 'Obliques', ARRAY['Core', 'Shoulders', 'Power'], ARRAY['Medicine Ball', 'Wall'], 'Rotation', 'intermediate', false, false, 'other', 'reps'),
  ('Sprawl',                    'From stance, shoot hips back and sprawl flat, pop back to feet quickly', 'Core', ARRAY['Shoulders', 'Cardio', 'Agility'], ARRAY[]::text[], 'Dynamic', 'intermediate', true, false, 'bodyweight', 'reps'),
  ('Neck Flexion',              'Lie on back, lift head off ground toward chest, lower slowly', 'Neck', ARRAY['Core'], ARRAY[]::text[], 'Flexion', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Neck Extension',            'Lie face down, lift head up and back, lower slowly', 'Neck', ARRAY[]::text[], ARRAY[]::text[], 'Extension', 'beginner', true, false, 'bodyweight', 'reps'),

  -- ═══════════════════════════════════════════════════════════════
  -- MOBILITY & FLEXIBILITY
  -- ═══════════════════════════════════════════════════════════════
  ('World''s Greatest Stretch', 'Lunge forward, rotate toward front leg, reach arm overhead — full body mobility', 'Hip Flexors', ARRAY['Thoracic Spine', 'Hamstrings', 'Glutes'], ARRAY[]::text[], 'Mobility', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Hip 90/90 Stretch',        'Sit with both legs at 90° angles, lean over front shin to stretch hip', 'Hip Flexors', ARRAY['Glutes', 'Adductors', 'External Rotators'], ARRAY[]::text[], 'Flexibility', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Thoracic Extension on Foam Roller','Lie back over foam roller at mid-back, extend over it to open thoracic spine', 'Thoracic Spine', ARRAY['Upper Back', 'Chest'], ARRAY['Foam Roller'], 'Mobility', 'beginner', true, false, 'other', 'duration'),
  ('Couch Stretch',             'Rear knee on ground against wall, hip pressed forward to stretch hip flexor', 'Hip Flexors', ARRAY['Quadriceps', 'Glutes'], ARRAY[]::text[], 'Flexibility', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Cat Cow',                   'On all fours, alternate arching and rounding spine through full range', 'Thoracic Spine', ARRAY['Lower Back', 'Core'], ARRAY[]::text[], 'Mobility', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Pigeon Pose',               'Front shin across mat, rear leg straight back, hinge forward over front shin', 'Glutes', ARRAY['Hip Flexors', 'External Rotators'], ARRAY[]::text[], 'Flexibility', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Spiderman Lunge',           'Step foot forward outside hand, sink hip toward ground, hold', 'Hip Flexors', ARRAY['Glutes', 'Adductors', 'Thoracic Spine'], ARRAY[]::text[], 'Mobility', 'beginner', true, false, 'bodyweight', 'reps'),
  ('Band Pull-Apart',           'Hold resistance band at arm length, pull apart to shoulder height', 'Rear Deltoids', ARRAY['Upper Back', 'Rotator Cuff'], ARRAY['Resistance Band'], 'Rear Delt Fly', 'beginner', false, false, 'other', 'reps')

ON CONFLICT DO NOTHING;
