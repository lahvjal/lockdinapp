# Offline-First Architecture Guide

This document outlines the offline-first architecture for LockdIn app, enabling users to track their habits even without internet connectivity.

## Overview

LockdIn uses a hybrid approach combining:
- **SQLite** for local data storage
- **Supabase** for cloud sync and backup
- **Background sync** for seamless data synchronization
- **Conflict resolution** for handling concurrent updates

## Architecture

```
┌─────────────────────────────────────────┐
│          React Native App               │
├─────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐  │
│  │   Redux      │◄──►│   SQLite     │  │
│  │   Store      │    │   Database   │  │
│  └──────┬───────┘    └──────────────┘  │
│         │                               │
│         ▼                               │
│  ┌──────────────┐                      │
│  │ Sync Service │                      │
│  └──────┬───────┘                      │
└─────────┼───────────────────────────────┘
          │
          ▼ (when online)
┌─────────────────────────────────────────┐
│        Supabase Cloud Database          │
└─────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: SQLite Setup

**Dependencies:**
```bash
npx expo install expo-sqlite @op-engineering/op-sqlite
```

**Database Schema (local):**
```sql
-- Workout logs
CREATE TABLE workout_logs_local (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT NOT NULL,
  workout_data TEXT, -- JSON
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Meal logs
CREATE TABLE meal_logs_local (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  meal_slot_id TEXT NOT NULL,
  description TEXT,
  calories INTEGER,
  protein REAL,
  carbs REAL,
  fats REAL,
  logged_at TEXT NOT NULL,
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Water logs
CREATE TABLE water_logs_local (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount_ml INTEGER NOT NULL,
  logged_at TEXT NOT NULL,
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sleep logs
CREATE TABLE sleep_logs_local (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  hours REAL NOT NULL,
  quality TEXT NOT NULL,
  notes TEXT,
  recovery_score INTEGER,
  synced INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sync queue for operations
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  record_id TEXT NOT NULL,
  data TEXT, -- JSON payload
  created_at TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0
);
```

### Phase 2: Database Service

**File:** `mobile/src/services/database.ts`

```typescript
import * as SQLite from 'expo-sqlite';

class DatabaseService {
  private db: SQLite.WebSQLDatabase | null = null;

  async init() {
    this.db = await SQLite.openDatabase('lockdin.db');
    await this.createTables();
  }

  async createTables() {
    // Create all tables with schema above
  }

  // Workout logs
  async insertWorkoutLog(log: WorkoutLog) {
    // Insert into workout_logs_local
  }

  async getWorkoutLogs(userId: string, startDate: string, endDate: string) {
    // Query local database
  }

  // Meal logs
  async insertMealLog(log: MealLog) {
    // Insert into meal_logs_local
  }

  // Water logs
  async insertWaterLog(log: WaterLog) {
    // Insert into water_logs_local
  }

  // Sleep logs
  async insertSleepLog(log: SleepLog) {
    // Insert into sleep_logs_local
  }

  // Sync queue
  async addToSyncQueue(operation: string, tableName: string, recordId: string, data: any) {
    // Add to sync_queue
  }

  async getSyncQueue() {
    // Get all pending sync operations
  }

  async removeSyncQueueItem(id: number) {
    // Remove synced item
  }
}

export const dbService = new DatabaseService();
```

### Phase 3: Sync Service

**File:** `mobile/src/services/syncService.ts`

```typescript
import NetInfo from '@react-native-community/netinfo';
import { dbService } from './database';
import { supabase } from './supabase';

class SyncService {
  private isSyncing = false;
  private syncInterval: NodeJS.Timer | null = null;

  async startSync() {
    // Start periodic sync every 5 minutes
    this.syncInterval = setInterval(() => this.sync(), 5 * 60 * 1000);
    
    // Sync immediately when online
    NetInfo.addEventListener(state => {
      if (state.isConnected) {
        this.sync();
      }
    });
  }

  async sync() {
    if (this.isSyncing) return;
    
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return;

    this.isSyncing = true;

    try {
      // 1. Push local changes to Supabase
      await this.pushLocalChanges();

      // 2. Pull remote changes from Supabase
      await this.pullRemoteChanges();

      // 3. Resolve conflicts if any
      await this.resolveConflicts();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async pushLocalChanges() {
    const queue = await dbService.getSyncQueue();

    for (const item of queue) {
      try {
        const data = JSON.parse(item.data);

        if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
          const { error } = await supabase
            .from(item.table_name)
            .upsert(data);

          if (error) throw error;

          // Mark as synced in local DB
          await this.markAsSynced(item.table_name, item.record_id);
          await dbService.removeSyncQueueItem(item.id);
        } else if (item.operation === 'DELETE') {
          const { error } = await supabase
            .from(item.table_name)
            .delete()
            .eq('id', item.record_id);

          if (error) throw error;
          await dbService.removeSyncQueueItem(item.id);
        }
      } catch (error) {
        console.error(`Sync error for ${item.table_name}:`, error);
        // Increment retry count
      }
    }
  }

  private async pullRemoteChanges() {
    // Get last sync timestamp
    const lastSync = await this.getLastSyncTimestamp();

    // Fetch changes from Supabase since last sync
    const tables = ['workout_logs', 'meal_logs', 'water_logs', 'sleep_logs'];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .gte('updated_at', lastSync);

      if (error) {
        console.error(`Error fetching ${table}:`, error);
        continue;
      }

      // Insert/update local database
      for (const record of data || []) {
        await this.upsertLocalRecord(table, record);
      }
    }

    // Update last sync timestamp
    await this.updateLastSyncTimestamp();
  }

  private async resolveConflicts() {
    // Conflict resolution strategy: Last write wins
    // More sophisticated strategies can be implemented:
    // - Manual conflict resolution UI
    // - Merge strategies
    // - Versioning
  }

  private async markAsSynced(table: string, recordId: string) {
    // Update synced flag in local database
  }

  private async getLastSyncTimestamp(): Promise<string> {
    // Get from AsyncStorage or database
    return '';
  }

  private async updateLastSyncTimestamp() {
    // Save to AsyncStorage or database
  }

  private async upsertLocalRecord(table: string, record: any) {
    // Insert or update in local SQLite
  }
}

export const syncService = new SyncService();
```

### Phase 4: Redux Integration

**Update Redux slices to use local database:**

```typescript
// workoutSlice.ts
export const logExerciseSet = createAsyncThunk(
  'workout/logSet',
  async ({ setData, sessionId }: any, { getState }) => {
    // 1. Save to local database first
    await dbService.insertWorkoutLog(setData);

    // 2. Add to sync queue
    await dbService.addToSyncQueue('INSERT', 'workout_logs', setData.id, setData);

    // 3. Trigger sync if online
    syncService.sync();

    return setData;
  }
);
```

### Phase 5: Offline Indicator

**Component:** `mobile/src/components/common/OfflineIndicator.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });

    return () => unsubscribe();
  }, []);

  if (isOnline && !hasPendingSync) return null;

  return (
    <View style={styles.container}>
      {!isOnline && (
        <Text style={styles.text}>📵 Offline - Changes will sync when online</Text>
      )}
      {hasPendingSync && (
        <Text style={styles.text}>🔄 Syncing...</Text>
      )}
    </View>
  );
}
```

## Data Flow

### Writing Data (Offline-First)

1. User performs action (log workout, log meal, etc.)
2. Data is saved to local SQLite database immediately
3. Operation is added to sync queue
4. UI updates instantly (no loading spinner)
5. Background sync attempts to push to Supabase
6. If offline, changes stay in sync queue
7. When online, sync service pushes changes automatically

### Reading Data (Local-First)

1. App queries local SQLite database first
2. Data is displayed immediately
3. Background sync pulls new data from Supabase
4. Local database is updated
5. UI updates with new data via Redux

## Conflict Resolution

**Strategy: Last Write Wins (LWW)**

```typescript
async function resolveConflict(localRecord: any, remoteRecord: any) {
  const localTime = new Date(localRecord.updated_at);
  const remoteTime = new Date(remoteRecord.updated_at);

  if (remoteTime > localTime) {
    // Remote is newer, use remote
    await dbService.updateLocalRecord(remoteRecord);
  } else {
    // Local is newer, push to remote
    await supabase.from(table).upsert(localRecord);
  }
}
```

**Alternative strategies:**
- Manual conflict resolution UI
- Merge both changes
- Field-level merging
- Operational transformation

## Best Practices

### 1. Always Write Locally First
```typescript
// ✅ Good
await dbService.insertLog(data);
await syncQueue.add(data);

// ❌ Bad
await supabase.from('logs').insert(data); // Fails offline
```

### 2. Use Optimistic UI
```typescript
// Update UI immediately
dispatch(addLog(newLog));

// Sync in background
syncService.sync().catch(handleSyncError);
```

### 3. Handle Sync Errors Gracefully
```typescript
try {
  await syncService.sync();
} catch (error) {
  // Don't block UI
  // Log error for retry
  console.error('Sync failed, will retry:', error);
}
```

### 4. Implement Retry Logic
```typescript
async function syncWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await syncService.sync();
      return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await delay(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

### 5. Show Sync Status
```typescript
// Sync indicator in UI
<OfflineIndicator />
<SyncStatus pendingCount={syncQueue.length} />
```

## Testing

### Test Scenarios

1. **Offline Creation**
   - Disable network
   - Log workout/meal/water/sleep
   - Verify data is in local database
   - Enable network
   - Verify data syncs to Supabase

2. **Conflict Resolution**
   - Device A: Create log offline
   - Device B: Create log offline
   - Both devices come online
   - Verify conflict is resolved

3. **Sync Queue**
   - Create multiple logs offline
   - Verify all are in sync queue
   - Enable network
   - Verify all sync in order

4. **Offline Reading**
   - Disable network
   - Open app
   - Verify all data is available

## Migration Strategy

### Migrating Existing Users

```typescript
async function migrateToOfflineFirst(userId: string) {
  // 1. Download all user data from Supabase
  const allData = await fetchAllUserData(userId);

  // 2. Insert into local SQLite
  await dbService.bulkInsert(allData);

  // 3. Mark all as synced
  await dbService.markAllAsSynced();

  // 4. Set migration complete flag
  await AsyncStorage.setItem('offline_migration_complete', 'true');
}
```

## Performance Considerations

1. **Database Indexing**
   - Index on user_id for fast filtering
   - Index on date for time-range queries
   - Index on synced flag for sync queue

2. **Batch Operations**
   - Batch inserts for performance
   - Limit sync batch size
   - Use transactions for consistency

3. **Data Cleanup**
   - Archive old logs (>90 days)
   - Clear synced queue items
   - Vacuum database periodically

## Security

1. **Encryption at Rest**
   ```typescript
   import * as SecureStore from 'expo-secure-store';
   
   // Encrypt sensitive data
   await SecureStore.setItemAsync('db_key', encryptionKey);
   ```

2. **Secure Sync**
   - Use HTTPS only
   - Verify SSL certificates
   - Authenticate sync requests

3. **Data Validation**
   - Validate on write
   - Sanitize inputs
   - Check user permissions

## Dependencies

```json
{
  "dependencies": {
    "expo-sqlite": "^13.0.0",
    "@react-native-community/netinfo": "^11.0.0",
    "expo-secure-store": "^12.0.0"
  }
}
```

## Resources

- [Expo SQLite Documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [React Native NetInfo](https://github.com/react-native-netinfo/react-native-netinfo)
- [Offline-First Architecture Patterns](https://offlinefirst.org/)
