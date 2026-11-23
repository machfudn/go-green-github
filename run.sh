#!/usr/bin/env bash
set -euo pipefail

# Menentukan direktori script (lokasi repo)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Pastikan branch lokal sinkron dengan remote sebelum commit baru
git pull --rebase origin main || true

# Environment variables untuk commit scheduler
export GIT_USER="Machfudin"
export GIT_EMAIL="your-email"
export WEEKDAY_MIN=5
export WEEKDAY_MAX=10
export WEEKEND_MIN=1
export WEEKEND_MAX=3
export START_HOUR=8
export END_HOUR=17
export TZ="Asia/Jakarta"

# Jalankan bot
node dist/index.js
