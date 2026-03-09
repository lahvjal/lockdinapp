-- Add missing UPDATE and DELETE RLS policies for the workouts table.
-- Without these, plan edits that call .update() on workout rows return
-- rowsAffected=0 even when the row IDs are correct, because Postgres
-- silently filters them out at the RLS layer.

CREATE POLICY "Users can update workouts in own plans" ON public.workouts
  FOR UPDATE USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  ) WITH CHECK (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete workouts in own plans" ON public.workouts
  FOR DELETE USING (
    plan_id IN (SELECT id FROM public.plans WHERE user_id = auth.uid())
  );
