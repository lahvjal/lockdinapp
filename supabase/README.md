# LockdIn Supabase Configuration

This directory contains the Supabase backend configuration for the LockdIn app.

## Setup

### 1. Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Save your project URL and anon key

### 2. Run Database Migration

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Execute the SQL script

This will create:
- All database tables with proper relationships
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic timestamp updates

### 3. Configure Authentication

1. Navigate to Authentication > Providers in Supabase dashboard
2. Enable Google OAuth:
   - Create OAuth credentials in Google Cloud Console
   - Add the OAuth client ID and secret
3. Enable Apple Sign In:
   - Configure Apple Sign In in Apple Developer portal
   - Add the Service ID and key

### 4. Set Up Storage (Optional)

1. Navigate to Storage in Supabase dashboard
2. Create a bucket named `profile-images`
3. Set appropriate access policies

## Database Schema

### Core Tables

- **user_profiles** - Extended user data beyond auth
- **exercises** - Exercise database with tagging
- **plans** - User workout/meal/water/sleep plans
- **workouts** - Daily workout assignments
- **workout_logs** - Exercise performance tracking
- **exercise_substitutions** - One-time exercise swaps
- **meal_slots** - Meal structure from plans
- **meal_logs** - Food intake tracking
- **water_logs** - Daily water intake
- **sleep_logs** - Sleep duration and quality
- **streaks** - Per-category streak tracking
- **badges** - Achievement definitions
- **user_badges** - Earned achievements
- **skip_tokens** - Monthly skip allocations

### Security

All tables have Row Level Security (RLS) enabled with policies ensuring users can only access their own data.

## Edge Functions

Edge Functions will be added in later phases for:
- Daily streak calculations (cron job)
- 2-week check-in triggers
- Exercise substitution matching algorithm
- Badge award logic

To deploy Edge Functions:
```bash
supabase functions deploy function-name
```

## Environment Variables

Add these to your mobile app's `.env` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Seeding Data

Exercise seed data will be added in Phase 2. The seed script will populate the `exercises` table with ~100-150 common exercises tagged by:
- Primary muscle group
- Equipment required
- Movement pattern
- Difficulty level

## Local Development

For local Supabase development:

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase locally
supabase init

# Start local Supabase
supabase start

# Run migrations
supabase db reset
```

## Backup

Regularly backup your database:
```bash
supabase db dump -f backup.sql
```

## Monitoring

- Check database logs in Supabase dashboard
- Monitor RLS policy performance
- Review API usage and quotas
