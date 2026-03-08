#!/bin/bash
# LockdIn dev server launcher
# Starts watchman with user-owned paths to avoid the macOS ~/.local/state permission issue,
# then exports WATCHMAN_SOCK so Metro finds the running daemon.

set -e

WATCHMAN_STATEDIR="$HOME/watchman-state"
WATCHMAN_SOCK="/tmp/watchman-lockdin.sock"
WATCHMAN_PID="/tmp/watchman-lockdin.pid"
WATCHMAN_LOG="$HOME/watchman-state/watchman.log"

mkdir -p "$WATCHMAN_STATEDIR"

echo "→ Starting watchman..."
watchman \
  --unix-listener-path="$WATCHMAN_SOCK" \
  --statefile="$WATCHMAN_STATEDIR/watchman.json" \
  --pidfile="$WATCHMAN_PID" \
  --logfile="$WATCHMAN_LOG" \
  version > /dev/null 2>&1

echo "→ Watchman running (socket: $WATCHMAN_SOCK)"

# Point Metro to our watchman instance
export WATCHMAN_SOCK="$WATCHMAN_SOCK"

# Raise file descriptor limit for this session
ulimit -n 65536 2>/dev/null || ulimit -n 10240 2>/dev/null || true

echo "→ Starting Expo..."
# EXPO_YES auto-accepts prompts like "Expo Go is outdated, upgrade?"
EXPO_YES=true npx expo start "$@"
