# LockdIn App — Full Breakdown
*Codename: LockdIn | Last Updated: March 2026*

---

## App Identity

LockDin is a **structured habit companion** for people who already have a plan and just need help following it, staying accountable, and tracking progress. It is not an optimizer, not a social platform — it is a personal coach that understands real life.

**Core philosophy:** Show you what to do today, let you check it off, and reward you for doing it. Everything else — history, trends, plan setup — is secondary to that daily ritual.

**Target user:** Someone who wants a set plan and a list of actions, and needs help tracking and staying accountable.

---

## Onboarding & Plan Creation

- Conversational setup flow — asks about goal, experience level, available days, equipment access, and dietary style
- Generates a **workout split** (Push/Pull/Legs, Upper/Lower, Full Body, etc.) and a **meal timing structure**
- Nutrition plan is lightweight: meal slots defined by timing and type (e.g., Breakfast, Lunch, Pre-workout snack, Dinner) — no macro targets required unless the user wants them
- Plans are editable but structured — changes are substitutions or adjustments, never rewrites
- Syncs with **Apple Health / HealthKit**

### Plan Naming
- User names each plan freely (e.g., "Summer Cut," "Back to Basics," "Marathon Prep")
- Name is set during plan creation and editable afterward
- If no name is entered, defaults to a neutral placeholder (e.g., "Workout Plan 1")

### Plan Duration
Each category plan can be set to one of three duration modes:

- **Indefinite** — runs until manually ended (default for all categories)
- **Fixed duration** — set by number of weeks or a specific end date
- **Check-in based** — no set end, but app prompts "keep going?" every 2 weeks

When a duration is set on one category, the app asks:
*"Apply this duration to your other plans too?"*
Options: Apply to all / Choose which ones / Keep others indefinite

### Plan Seasons
Each completed or ended plan is archived with full stats: duration, completion rate, PRs hit, streaks achieved. Plans are referenced by their user-given name.

### No Overlapping Plans
Plans of the same category cannot overlap. If a user tries to start a new workout plan while one is active, they must end the current plan first. The app prompts: *"You have an active plan — [Plan Name]. To start a new one, you'll need to end your current plan first."*

### What Happens When a Plan Ends

**Fixed duration ends:**
- App celebrates completion with a milestone moment
- Prompts: *"You completed [Plan Name]. Want to start a new one, extend this one, or take a rest week?"*
- Plan is archived with full stats
- Streak carries over with a grace window if a new plan starts immediately

**Check-in prompt (every 2 weeks):**
- Low friction: *"You've been at it for 2 weeks — keep going?"* → Continue / Adjust / End
- Reminder sent if user doesn't respond within a day
- "Adjust" opens a lightweight plan tweak flow, not a full rebuild

**Indefinite plan manually ended:**
- Optional reason prompt (completed goal, switching programs, taking a break)
- Archived with a completion summary

---

## The Four Tracking Categories

Each category has its own streak and contributes to the overall day streak. Users choose which categories they actively track — only active categories count toward streaks.

---

### 1. Workout

- Daily workout assigned from the plan's split
- Log each exercise: sets, reps, weight
- Rest timer and work timer built in
- Rest timer lives on screen between sets and on the lock screen widget when a workout is active
- Previous session data shown as a ghost reference ("Last time: 3×8 at 135 lbs")
- One-tap to copy last session's numbers as a starting point
- Timed exercises supported (planks, cardio intervals)
- Full substitution system (see Exercise Substitution System)

---

### 2. Meals

- Meal slots pre-populated from the plan (Breakfast, Lunch, Pre-workout snack, Dinner, etc.)
- Tap a slot to log: a name or description of what was eaten is sufficient
- Calories and nutrition details are optional — not required
- Timestamp is auto-captured at the time of logging
- No barcode scanner — simplicity is the feature, not a limitation

---

### 3. Water

- Simple intake logging
- Tap-to-increment model (per glass or per bottle)
- Daily target set during onboarding

---

### 4. Sleep & Recovery

- Log sleep start time and end time — duration is auto-calculated
- Optional sleep quality rating (1–5 scale or emoji)
- Optional recovery notes — free text or tags (e.g., "sore legs," "feeling fresh," "stressed")
- On rest days, sleep and recovery logging becomes the primary action so the day still feels productive and streak-worthy
- Trends view: sleep duration overlaid against workout performance over time

---

## Streaks & Gamification

### Per-Category Streaks
Each active category maintains its own streak counter:
- Workout streak
- Meal streak
- Water streak
- Sleep & Recovery streak

Missing one category does not affect the others.

### Overall Day Streak
Percentage-based — completing some but not all items still counts as a streak day. A day is "alive" as long as any logging occurred.

**Flame visualization:**
- Full flame = 100% completion
- Half-filled flame = ~60% completion
- Faint ember = low completion

### Gamification Elements
- Milestone badges: first workout, 7-day streak, PR on an exercise, 30-day streak, plan completion, etc.
- Weekly report card with an overall completion score
- Rest days are streak-worthy via recovery logging
- Streak carries over between consecutive plans with a short grace window
- Streak at-risk warning notification: *"Log something today to keep your streak alive"*

---

## Exercise Substitution System

Handles the real-world scenario where equipment is unavailable or occupied.

### Scenario A — User knows what they want to swap
- Long-press or swipe an exercise to reveal "Swap Exercise"
- Browse or search alternatives filtered by the same muscle group and movement pattern
- The swap is logged as a **one-time substitution** — the original plan is preserved
- History shows the substitution with a distinct swap icon
- Next session still shows the original exercise from the plan

### Scenario B — User doesn't know their options
- Clearly visible button on the exercise screen: **"Equipment not available"**
- App suggests 2–3 alternatives based on matching movement pattern and muscle group
- Each suggestion shows: equipment required, muscles targeted, brief description
- User picks one, logs it, and continues

### Scenario C — Entire session needs to change
- **"Bodyweight only mode"** — single tap regenerates the entire session with bodyweight alternatives
- Useful for hotel gyms, traveling, or unexpected home workouts

### Exercise Tagging (powers all suggestions)
Every exercise is tagged with:
- Primary muscle group
- Equipment required
- Movement pattern (e.g., horizontal pull, vertical push, hinge, squat, carry)

Matching is prioritized by **movement pattern** first, then muscle group — a Dumbbell Row is a better substitute for Cable Row than a Pull-Up, even though all three work the back.

### Substitution History & Insights
- Substitutions are logged distinctly in history with a swap icon
- App surfaces patterns over time: *"You've substituted leg press 4 times this month — want to make Hack Squat your default?"*
- Consistent avoidance is visible in data and surfaced gently, not judgmentally

---

## Plan Flexibility Rules

Flexible but structured — the app adapts like a coach, not a pushover. Changes are substitutions or adjustments, never rewrites.

| Rule | Detail |
|------|--------|
| **Swap, don't delete** | Replace an exercise with one targeting the same muscle group; exercises cannot simply be removed |
| **Day shifting** | Move a workout to another day within the same week only — cannot roll indefinitely |
| **Skip tokens** | 1–2 per month to formally skip something without streak penalty; makes skipping feel intentional |
| **Locked core lifts** | Primary movements (squat, bench, deadlift) are flagged as non-swappable; accessories can flex |
| **Change history** | Every plan modification is logged so users can observe patterns in their own behavior |
| **Duration continuity** | Mid-plan edits do not reset the plan duration — the clock runs on the commitment, not the specific exercises |

---

## Lock Screen Widget

The hero feature — glanceable accountability without unlocking or opening the app.

- Only shows **active plans** — no empty slots or placeholders
- Widget slots are flexible and reorganize automatically as plans start or end
- Layout adapts: 1–4 slots depending on how many categories are active
- Compact vs. expanded layout consideration for 4 active categories

**What each slot can show:**
- Today's workout name + completion status (e.g., "Push Day — 3/6 done")
- Meal check-ins remaining
- Water progress
- Sleep/recovery logged or pending
- Current streak with flame visualization
- Active rest timer when a workout is in progress
- Overall day completion percentage

---

## History & Trends

- Calendar view with color-coded days: full completion, partial, missed
- Per-exercise progression charts (weight over time)
- Streak history and longest streak records
- Sleep duration overlaid against workout performance
- Weekly summary: workouts completed, meals logged, water hit, sleep average
- Substitution history per exercise
- Archived completed plans with full stats: duration, completion rate, PRs, streaks

---

## Notifications

- Meal logging nudges: *"You haven't logged lunch yet"*
- Rest timer alerts between sets
- Streak at-risk warnings: *"Log something today to keep your streak alive"*
- 2-week check-in prompts for check-in based plans
- Reminder if check-in prompt goes unanswered
- Weekly report card delivery
- Milestone and badge celebration alerts
- Plan completion celebration

---

## Apple Health / HealthKit Integration

- Sync workouts logged in LockDin to Apple Health
- Pull steps and activity data into the recovery/trends view
- Sleep data can optionally sync with or pull from Apple Health

---

## Edge Cases Covered

| Scenario | How LockDin Handles It |
|----------|------------------------|
| Equipment unavailable mid-workout | Substitution system — Scenario A or B |
| Entire gym unavailable | Bodyweight only mode — one tap regenerates the session |
| Traveling or irregular schedule | Day shifting within the same week |
| Burned out or sick | Skip tokens + recovery logging keeps streak alive |
| New user doesn't know alternatives | "Equipment not available" button with guided suggestions |
| Consistently avoiding an exercise | Substitution pattern insights surfaced gently |
| Rest days feeling unproductive | Recovery logging makes them count toward the streak |
| One bad category day | Tiered streaks — other category streaks are unaffected |
| Over-modifying the plan | Change history creates self-awareness without judgment |
| Trying to run two workout plans | Not allowed — active plan must be ended first |
| Plan ends with no new plan ready | Widget slot disappears cleanly, no streak pressure |
| Streak gap between consecutive plans | Short grace window preserves streak continuity |
| Mid-plan structure changes | Duration continues — the clock is on the commitment |

---

## Open Questions for Future Exploration

The following scenarios have been noted but not yet fully designed:

- **Injuries** — how to pause or modify a plan when a body part is injured
- **Deload weeks** — scheduled reduced-intensity weeks within a plan
- **Motivational slumps** — re-engagement flow when a user goes dark for a week or more
- **Multiple simultaneous plans** — e.g., a strength plan and a running plan running in parallel (currently blocked by no-overlap rule; needs a cross-category exception design)
- **Plan templates** — pre-built plans users can browse and start without building from scratch

---

*Document reflects brainstorm decisions as of March 2026. App is pre-design and pre-development.*