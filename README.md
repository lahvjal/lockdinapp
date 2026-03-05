# LockdIn App

**A structured habit companion for fitness tracking and accountability**

LockdIn is a personal coach app that helps you follow your workout and nutrition plans, stay accountable, and track your progress. Built for people who already have a plan and just need help executing it.

## 📋 Documentation

- [App Breakdown](./app-breakdown.md) - Complete feature specification and design decisions
- [Feature Roadmap](./feature-roadmap.md) - Phased implementation plan from MVP to advanced features
- [Build Plan](/.cursor/plans/) - Technical implementation plan

## 🎯 Core Features (MVP)

- **4 Tracking Categories**: Workouts, Meals, Water, Sleep & Recovery
- **Smart Exercise Substitution**: Equipment unavailable? Get instant alternatives
- **Flexible Streaks**: Per-category and overall day streaks with percentage-based completion
- **Lock Screen Widget**: Glanceable accountability without opening the app
- **Skip Tokens**: Intentional skips without breaking your streak
- **Plan Duration Modes**: Indefinite, fixed duration, or check-in based

## 🛠 Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **State Management**: Redux Toolkit
- **Database**: PostgreSQL with Row Level Security
- **Authentication**: Google & Apple Sign In via Supabase Auth
- **Native Modules**: SwiftUI (iOS Widget), Jetpack Glance (Android Widget)

## 📱 Platform Support

- iOS (HealthKit integration included)
- Android

## 🚀 Getting Started

Coming soon - project setup in progress.

## 📅 Status

**Current Phase**: Planning & Architecture
**Target**: MVP Launch

---

*Last Updated: March 2026*
