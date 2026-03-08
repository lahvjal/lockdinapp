-- 005_cardio_exercises.sql
-- Boxing, running, and time/distance-based exercises

-- Add metric_type column to exercises to distinguish rep, time, and distance exercises
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS metric_type TEXT
  CHECK (metric_type IN ('reps', 'duration', 'distance'))
  DEFAULT 'reps';

-- Seed boxing and running exercises
INSERT INTO public.exercises (name, description, primary_muscle_group, secondary_muscle_groups, equipment_required, movement_pattern, difficulty_level, is_bodyweight, is_locked, equipment_category, metric_type)
VALUES
  -- ── Shadow Boxing ──────────────────────────────────────────────────────────
  ('Shadow Boxing',             'Throw punches and move footwork without a bag or opponent, focus on technique', 'Full Body', ARRAY['Core', 'Shoulders', 'Cardio'], ARRAY[]::text[], 'Dynamic', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Heavy Bag Work',            'Punch and kick heavy bag in rounds, working combinations and power', 'Shoulders', ARRAY['Core', 'Arms', 'Cardio'], ARRAY['Heavy Bag'], 'Dynamic', 'beginner', false, false, 'other', 'duration'),
  ('Pad Work Combinations',     'Work punch/kick combinations on focus mitts held by a partner or trainer', 'Shoulders', ARRAY['Core', 'Reaction', 'Cardio'], ARRAY['Focus Mitts'], 'Dynamic', 'intermediate', false, false, 'other', 'duration'),
  ('Slip Bag Drill',            'Slip and weave around swinging slip bag to train defensive head movement', 'Core', ARRAY['Neck', 'Agility'], ARRAY['Slip Bag'], 'Dynamic', 'beginner', false, false, 'other', 'duration'),
  ('Defensive Slip Drill',      'Practice slipping punches from a training partner, maintaining stance', 'Core', ARRAY['Agility', 'Reaction'], ARRAY[]::text[], 'Dynamic', 'intermediate', true, false, 'bodyweight', 'duration'),
  ('Footwork Ladder Drill',     'Move through agility ladder in boxing stance, improving foot speed and coordination', 'Calves', ARRAY['Agility', 'Coordination'], ARRAY['Agility Ladder'], 'Dynamic', 'beginner', true, false, 'other', 'duration'),
  ('Heavy Bag Power Shots',     'Throw maximum power punches on heavy bag focusing on explosiveness', 'Shoulders', ARRAY['Core', 'Power'], ARRAY['Heavy Bag'], 'Dynamic', 'intermediate', false, false, 'other', 'duration'),
  ('Neck Bridge',               'Support body weight on back of head and neck, bridging motion for neck strength', 'Neck', ARRAY['Core'], ARRAY[]::text[], 'Isometric', 'advanced', true, false, 'bodyweight', 'duration'),

  -- ── Running ────────────────────────────────────────────────────────────────
  ('Easy Run',                  'Steady comfortable run at conversational pace, building aerobic base', 'Cardio', ARRAY['Legs', 'Glutes'], ARRAY[]::text[], 'Cardio', 'beginner', true, false, 'bodyweight', 'distance'),
  ('Tempo Run',                 'Sustained run at comfortably hard effort, near lactate threshold pace', 'Cardio', ARRAY['Legs', 'Core'], ARRAY[]::text[], 'Cardio', 'intermediate', true, false, 'bodyweight', 'distance'),
  ('Long Run',                  'Extended distance run at easy conversational effort to build aerobic endurance', 'Cardio', ARRAY['Legs', 'Mental Toughness'], ARRAY[]::text[], 'Cardio', 'intermediate', true, false, 'bodyweight', 'distance'),
  ('400m Run Interval',         'Run 400 metres at near-maximum effort, recover between intervals', 'Cardio', ARRAY['Legs', 'Power', 'VO2 Max'], ARRAY[]::text[], 'Cardio', 'intermediate', true, false, 'bodyweight', 'distance'),
  ('Easy Warm-Up Run',          'Short easy jog to warm up before harder running efforts', 'Cardio', ARRAY['Legs'], ARRAY[]::text[], 'Cardio', 'beginner', true, false, 'bodyweight', 'distance'),
  ('Easy Cool-Down Run',        'Short easy jog to flush legs after intense running sessions', 'Cardio', ARRAY['Legs'], ARRAY[]::text[], 'Cardio', 'beginner', true, false, 'bodyweight', 'distance'),
  ('Running Strides',           'Short accelerations of ~100m at roughly 90% effort, improving running economy', 'Cardio', ARRAY['Legs', 'Power'], ARRAY[]::text[], 'Dynamic', 'beginner', true, false, 'bodyweight', 'distance'),

  -- ── Mobility / Warm-Up ─────────────────────────────────────────────────────
  ('Dynamic Warm-Up',           'Leg swings, hip circles, high knees, butt kicks, and other dynamic mobility drills', 'Full Body', ARRAY['Hip Flexors', 'Hamstrings'], ARRAY[]::text[], 'Dynamic', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Post-Run Stretch',          'Static stretching routine targeting calves, hamstrings, hip flexors, and quads', 'Hamstrings', ARRAY['Calves', 'Hip Flexors', 'Glutes'], ARRAY[]::text[], 'Flexibility', 'beginner', true, false, 'bodyweight', 'duration'),
  ('Foam Roll Legs',            'Self-myofascial release on quads, IT band, hamstrings and calves using foam roller', 'Quadriceps', ARRAY['Hamstrings', 'Calves', 'IT Band'], ARRAY['Foam Roller'], 'Recovery', 'beginner', true, false, 'other', 'duration')
ON CONFLICT DO NOTHING;

-- Back-fill metric_type = 'reps' for all existing exercises that have NULL
UPDATE public.exercises SET metric_type = 'reps' WHERE metric_type IS NULL;

-- Set duration metric for timed exercises already in the library
UPDATE public.exercises SET metric_type = 'duration'
WHERE name IN (
  'Plank', 'Side Plank', 'Battle Ropes', 'Assault Bike',
  'Treadmill Run', 'Rowing Machine', 'Jump Rope', 'Stair Climber'
);
