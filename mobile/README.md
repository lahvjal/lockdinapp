# LockdIn Mobile App

React Native mobile application for the LockdIn fitness tracking platform.

## Setup Instructions

### Prerequisites

- Node.js >= 20.19.4
- npm or yarn
- Expo CLI
- Supabase account

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Set up Supabase database:
   - Create a new Supabase project at https://supabase.com
   - Run the migration in `../supabase/migrations/001_initial_schema.sql` using the SQL Editor in Supabase dashboard
   - Configure OAuth providers (Google, Apple) in Authentication > Providers

### Running the App

```bash
# Start the development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## Project Structure

```
mobile/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/
│   │   ├── workout/
│   │   └── streaks/
│   ├── screens/          # Screen components
│   │   ├── onboarding/
│   │   ├── home/
│   │   ├── workout/
│   │   ├── meals/
│   │   ├── water/
│   │   ├── sleep/
│   │   └── profile/
│   ├── store/            # Redux state management
│   │   ├── slices/
│   │   └── store.ts
│   ├── services/         # API and external services
│   │   ├── supabase.ts
│   │   ├── healthKit.ts
│   │   └── sync.ts
│   ├── navigation/       # Navigation configuration
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── data/             # Static data and seed files
├── ios/                  # iOS native code
├── android/              # Android native code
├── App.tsx               # Entry point
└── package.json
```

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI Library**: React Native Paper
- **Navigation**: React Navigation v6
- **Forms**: React Hook Form + Zod
- **Storage**: Expo SecureStore, SQLite

## Features Implemented

### Phase 1: Foundation ✅
- React Native with Expo setup
- TypeScript configuration
- Redux Toolkit store with slices for:
  - Authentication
  - Workout tracking
  - Meal logging
  - Water tracking
  - Sleep/recovery
  - Streaks
  - Plan management
- Supabase client configuration
- Database schema with RLS policies
- Type definitions

### Next Steps
- Implement authentication screens (Google/Apple Sign In)
- Create onboarding flow
- Build workout tracking interface
- Implement other tracking categories
- Add streak calculations
- Develop lock screen widgets

## Development

### Adding New Dependencies

```bash
npm install <package-name>

# For Expo-specific packages
npx expo install <package-name>
```

### Type Checking

```bash
npm run tsc
```

### Linting

```bash
npm run lint
```

## Environment Variables

Required environment variables:

- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Troubleshooting

### Node Version Issues

If you see engine warnings, update Node.js:
```bash
nvm install 20.19.4
nvm use 20.19.4
```

### Expo Issues

Clear Expo cache:
```bash
npx expo start -c
```

### Metro Bundler Issues

Reset Metro bundler cache:
```bash
rm -rf node_modules
npm install
npx expo start -c
```

## License

Proprietary - All rights reserved
