-- 006_scheduled_plan_status.sql
-- Add 'scheduled' as a valid plan status (for future-dated plans)

ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS plans_status_check;

ALTER TABLE public.plans
  ADD CONSTRAINT plans_status_check
  CHECK (status IN ('active', 'completed', 'archived', 'scheduled'));
