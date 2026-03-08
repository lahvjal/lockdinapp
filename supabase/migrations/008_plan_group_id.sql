-- 008_plan_group_id.sql
-- Links plans created together (same name, same session) via a shared group_id.
-- This lets the history tab show one card per "plan creation event" instead of
-- one card per category.

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS group_id UUID;

-- Back-fill: group existing rows that share the same (user_id, name, start_date, status)
-- so old plans are already grouped correctly.
UPDATE public.plans p
SET group_id = grp.gid
FROM (
  SELECT
    user_id, name, start_date,
    gen_random_uuid() AS gid,
    array_agg(id) AS ids
  FROM public.plans
  WHERE group_id IS NULL
  GROUP BY user_id, name, start_date
) grp
WHERE p.user_id = grp.user_id
  AND p.name    = grp.name
  AND p.start_date = grp.start_date
  AND p.id = ANY(grp.ids);

-- Any rows still missing group_id (edge cases) get their own UUID
UPDATE public.plans
SET group_id = gen_random_uuid()
WHERE group_id IS NULL;

-- Index for efficient group lookups
CREATE INDEX IF NOT EXISTS plans_group_id_idx ON public.plans(group_id);
