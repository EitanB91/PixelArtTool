#!/bin/bash
# V&V Layer 1 Hook — Session Logger
# Appends session start/end events to usage-log.jsonl
# Zero token cost — runs as a plain shell script, no AI involved.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_FILE="$PROJECT_DIR/.claude/vault-and-valve/usage-log.jsonl"

# Read hook input from stdin
INPUT=$(cat)

# Extract fields from hook input JSON
EVENT=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).hook_event_name||'unknown')}catch(e){console.log('unknown')}})")
SESSION_ID=$(echo "$INPUT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).session_id||'unknown')}catch(e){console.log('unknown')}})")

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build log entry using node for reliable JSON
LOG_ENTRY=$(node -e "console.log(JSON.stringify({ts:'$TIMESTAMP',event:'$EVENT',session:'$SESSION_ID',source:'hook'}))")

# Append to log
echo "$LOG_ENTRY" >> "$LOG_FILE"

exit 0
