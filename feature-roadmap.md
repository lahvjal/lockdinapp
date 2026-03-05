# LockdIn App - Feature Roadmap
*Complete feature breakdown organized by implementation phases*

---

## Phase 1: MVP (Minimum Viable Product)

### Core Foundation
- [x] React Native with Expo setup
- [x] Supabase backend configuration
- [x] PostgreSQL database schema with RLS policies
- [x] Social authentication (Google & Apple Sign In)
- [x] Redux Toolkit state management
- [x] Offline-first architecture with SQLite local storage
- [x] Cloud sync with Supabase

### Onboarding & Plan Creation
- [x] Conversational onboarding flow
- [x] User profile setup (goal, experience level, available days)
- [x] Equipment access selection
- [x] Dietary style preferences
- [x] Rule-based workout split generation
  - Push/Pull/Legs (6 days)
  - Upper/Lower (4 days)
  - Full Body (3 days)
- [x] Meal timing structure generator
- [x] Plan naming (custom or default)
- [x] Plan duration modes
  - Indefinite (default)
  - Fixed duration (weeks or end date)
  - Check-in based (prompt every 2 weeks)
- [x] Duration sync across categories option

### Exercise Database
- [x] Seed database with 100-150 common exercises
- [x] Exercise tagging system
  - Primary muscle group
  - Equipment required
  - Movement pattern (horizontal pull, vertical push, hinge, squat, carry, etc.)
- [x] Exercise search and filtering
- [x] Database indexing for performance

### Workout Tracking (Category 1)
- [x] Daily workout screen with assigned exercises
- [x] Exercise logging interface
  - Sets, reps, weight entry
  - Ghost reference from last session
  - One-tap copy from previous workout
- [x] Rest timer
  - In-app timer modal
  - Lock screen persistence
  - Between-set tracking
- [x] Exercise substitution system
  - **Scenario A**: Long-press/swipe to swap exercise
  - **Scenario B**: "Equipment not available" button with suggestions
  - Substitution history tracking with swap icon
  - Smart matching algorithm (movement pattern priority)
- [x] Previous session data display
- [x] Workout completion tracking

### Meal Tracking (Category 2)
- [x] Meal slot display from plan
- [x] Tap-to-log interface
- [x] Food description entry (simple text)
- [x] Optional calories and macros
- [x] Automatic timestamping
- [x] Meal completion status

### Water Tracking (Category 3)
- [x] Tap-to-increment counter
- [x] Daily target setting
- [x] Progress bar visualization
- [x] Quick log from home screen

### Sleep & Recovery (Category 4)
- [x] Sleep time entry (start and end)
- [x] Automatic duration calculation
- [x] Sleep quality rating (1-5 scale)
- [x] Optional recovery notes (free text or tags)
- [x] Rest day prominence
- [x] Recovery logging as streak-worthy action

### Streaks & Gamification
- [x] Per-category streak counters
  - Workout streak
  - Meal streak
  - Water streak
  - Sleep & Recovery streak
- [x] Overall day streak (percentage-based)
- [x] Flame visualization
  - Full flame = 100% completion
  - Half-filled flame = ~60% completion
  - Faint ember = low completion
- [x] Streak carry-over between plans (grace window)
- [x] Streak at-risk warning notifications
- [x] Milestone badges
  - First workout
  - 7-day streak
  - 30-day streak
  - PR on an exercise
  - Plan completion

### Skip Tokens System
- [x] Monthly allocation (1-2 tokens per month)
- [x] Skip without streak penalty
- [x] Token usage tracking
- [x] Intentional skip flow
- [x] Token reset on month rollover

### Plan Duration & Lifecycle
- [x] Active plan tracking per category
- [x] No overlapping plans per category
- [x] Plan completion celebration
- [x] Plan archive system with stats
  - Duration
  - Completion rate
  - PRs hit
  - Streaks achieved
- [x] Check-in prompts (every 2 weeks for check-in mode)
- [x] Plan ending options
  - Start new plan
  - Extend current plan
  - Take rest week
- [x] Optional ending reason tracking

### Lock Screen Widget
- [x] iOS widget (SwiftUI)
  - Dynamic 1-4 slots based on active plans
  - Workout progress display
  - Meals remaining count
  - Water progress
  - Sleep status
  - Streak flame visualization
  - Rest timer when workout active
  - Overall day completion percentage
- [x] Android widget (Jetpack Glance)
  - Same functionality as iOS
  - Platform-specific design
- [x] Automatic layout adjustment
- [x] Real-time data sync via shared storage

### Apple Health Integration
- [x] HealthKit permissions during onboarding
- [x] Workout data sync to Apple Health
- [x] Logged exercises as workout sessions
- [x] Settings toggle for auto-sync
- [x] Optional sleep data pull from Health

### Notifications
- [x] Streak at-risk warnings
- [x] Meal logging nudges
- [x] Rest timer alerts
- [x] Check-in prompts (2-week intervals)
- [x] Check-in reminder if unanswered
- [x] Badge celebration alerts
- [x] Plan completion celebration

### Plan Flexibility (Basic)
- [x] Exercise substitution (swap, not delete)
- [x] Day shifting within same week
- [x] Skip tokens for formal skips
- [x] Change history logging
- [x] Duration continuity (edits don't reset plan clock)

### Core UI/UX
- [x] Home screen with today's actions
- [x] Navigation structure
- [x] Loading states and skeleton screens
- [x] Error handling and retry logic
- [x] Empty states for new users
- [x] Onboarding walkthrough

---

## Phase 2: History & Analytics

### Data Visualization
- [ ] Calendar view with color-coded completion days
  - Full completion
  - Partial completion
  - Missed days
- [ ] Per-exercise progression charts
  - Weight over time
  - Volume trends
  - PR tracking
- [ ] Weekly summary dashboard
  - Workouts completed
  - Meals logged
  - Water intake average
  - Sleep average
- [ ] Monthly overview
- [ ] Streak history timeline
- [ ] Longest streak records
- [ ] Substitution history per exercise

### Advanced Insights
- [ ] Sleep duration overlaid against workout performance
- [ ] Rest day correlation with performance
- [ ] Volume trends per muscle group
- [ ] Weekly completion patterns
- [ ] Personal bests timeline
- [ ] Category completion comparison

### Weekly Report Cards
- [ ] Overall completion score
- [ ] Category-by-category breakdown
- [ ] Improvement highlights
- [ ] Suggestions for next week
- [ ] Delivered via notification

### Archived Plans View
- [ ] Plan history browser
- [ ] Detailed stats per archived plan
- [ ] Comparison between plans
- [ ] Export plan data

---

## Phase 3: Enhanced Exercise System

### Timed Exercises
- [ ] Support for time-based exercises
  - Planks
  - Wall sits
  - Cardio intervals
- [ ] Duration tracking
- [ ] Time-based progression display

### Bodyweight-Only Mode (Scenario C)
- [ ] One-tap full workout regeneration
- [ ] Bodyweight alternatives for entire session
- [ ] Useful for travel, home workouts, limited equipment
- [ ] Temporary mode (doesn't affect saved plan)

### Substitution Pattern Insights
- [ ] Track repeated substitutions
- [ ] Surface patterns: *"You've substituted leg press 4 times this month"*
- [ ] Suggestion to make substitute permanent
- [ ] Exercise avoidance visibility
- [ ] Non-judgmental presentation

### Exercise Library
- [ ] Browse full exercise database
- [ ] Filter by muscle group, equipment, movement pattern
- [ ] Exercise detail pages
  - Instructions
  - Form tips
  - Video demonstrations (if available)
  - Muscles worked diagram
- [ ] Add custom exercises
- [ ] Edit exercise tags
- [ ] Favorite exercises

### Locked Core Lifts
- [ ] Flag primary movements as non-swappable
  - Squat
  - Bench press
  - Deadlift
  - Other compound movements
- [ ] Visual indication of locked exercises
- [ ] Admin/coach override option

---

## Phase 4: Plan Customization & Templates

### Advanced Plan Editing
- [ ] In-plan exercise swaps
- [ ] Add/remove exercises (with constraints)
- [ ] Adjust sets/reps schemes
- [ ] Modify rest periods
- [ ] Change workout days
- [ ] Edit meal slot names and timing

### Deload Weeks
- [ ] Scheduled reduced-intensity weeks
- [ ] Automatic deload suggestion after 4-6 weeks
- [ ] Volume reduction calculation
- [ ] Deload tracking in history
- [ ] Recovery metrics during deload

### Injury Management
- [ ] Body part injury tracking
- [ ] Pause specific exercises
- [ ] Modified workout generation (excluding injured areas)
- [ ] Recovery timeline
- [ ] Gradual reintroduction flow

### Pre-built Plan Templates
- [ ] Curated workout programs
  - Beginner strength
  - Hypertrophy focus
  - Powerlifting
  - Athletic performance
  - Home workouts
- [ ] Browse template library
- [ ] One-click start from template
- [ ] Template customization before start
- [ ] Community-shared templates (future consideration)

### Plan Copying
- [ ] Duplicate existing plan
- [ ] Copy from archived plan
- [ ] Modify copy before starting

---

## Phase 5: Social & Accountability (Optional)

### Accountability Partners
- [ ] Add workout buddy/accountability partner
- [ ] Share progress with specific people
- [ ] See partner's streak and completion
- [ ] Mutual encouragement features
- [ ] Privacy controls

### Challenges
- [ ] Time-bound challenges
- [ ] Streak challenges
- [ ] Volume challenges
- [ ] Personal vs. group challenges

### Coach/Trainer Integration
- [ ] Coach account type
- [ ] Coach can view client progress
- [ ] Coach can modify client plans
- [ ] Check-in messaging
- [ ] Progress reports for coaches

---

## Phase 6: Advanced Features

### Re-engagement System
- [ ] Detect when user goes dark (1+ week inactive)
- [ ] Gentle re-engagement flow
- [ ] "Life happens" acknowledgment
- [ ] Easy plan restart or modification
- [ ] No guilt-based messaging

### Cross-Category Plans
- [ ] Support for multiple simultaneous plans
  - Example: strength plan + running plan
- [ ] Cross-category exception to no-overlap rule
- [ ] Unified schedule view
- [ ] Inter-plan rest day coordination

### Nutrition Expansion
- [ ] Optional macro targets
- [ ] Macro breakdown per meal
- [ ] Weekly macro trends
- [ ] Integration with nutrition APIs
- [ ] Meal planning suggestions

### Advanced Water Tracking
- [ ] Custom container sizes
- [ ] Hydration reminders based on activity
- [ ] Weather-adjusted recommendations
- [ ] Integration with workout intensity

### Form Check & Media
- [ ] Exercise video recording
- [ ] Form check requests
- [ ] Progress photos
- [ ] Before/after comparisons
- [ ] Private media library

### Smart Recommendations
- [ ] AI-powered workout suggestions based on performance
- [ ] Adaptive volume recommendations
- [ ] Rest day optimization
- [ ] Personalized substitution learning

### Export & Integration
- [ ] Export workout data (CSV, JSON)
- [ ] Integration with other fitness apps
- [ ] API for third-party tools
- [ ] Backup/restore functionality

### Premium Features
- [ ] Advanced analytics and insights
- [ ] Unlimited plan templates
- [ ] Custom branding for coaches
- [ ] Priority support
- [ ] Extended history retention

---

## Feature Priority Matrix

### Must Have (Phase 1 - MVP)
All tracking categories, streaks, substitution system, lock screen widget, plan management, skip tokens

### Should Have (Phase 2-3)
History/analytics, timed exercises, bodyweight mode, substitution insights, exercise library

### Nice to Have (Phase 4-5)
Plan templates, injury management, deload weeks, social features, accountability

### Future Consideration (Phase 6)
Advanced AI features, premium tier, coach tools, extensive integrations

---

## Technical Debt & Polish Items

### Performance Optimization
- [ ] Database query optimization
- [ ] Image caching strategy
- [ ] Lazy loading for lists
- [ ] Background sync efficiency

### Accessibility
- [ ] VoiceOver/TalkBack support
- [ ] High contrast mode
- [ ] Font scaling
- [ ] Color blind friendly visualizations

### Localization
- [ ] Multi-language support
- [ ] Timezone handling improvements
- [ ] Regional date/time formats
- [ ] Unit conversion (lbs/kg, etc.)

### Advanced Testing
- [ ] Comprehensive unit test coverage
- [ ] Integration test suite
- [ ] E2E test automation
- [ ] Performance testing
- [ ] Security audit

---

*Last Updated: March 2026*
*This roadmap is subject to change based on user feedback and technical considerations*
