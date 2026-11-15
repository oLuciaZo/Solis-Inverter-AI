#!/usr/bin/env bash
# AI Team Kit v2 — run.sh
# usage: .ai/scripts/run.sh <agy|opencode> <TASK_ID> [timeout_minutes] [model|auto]
# exit: 0 = report written, 1 = failed, 2 = bad input, 3 = worker quota/rate limit hit
# Emits dashboard events (via status.sh) and a heartbeat every 10s into the state dir outside the repo.
# Model selection (when the 4th argument is empty or "auto"):
#   1. a "Model:" line in the task file          2. <worker>.<type> in models.conf (type = the task's "Type:")
#   3. <worker>.default in models.conf           4. nothing -> the CLI's own default
#   On a quota/rate-limit hit, each model in <worker>.fallback is tried once before giving up with exit 3.
#   models.conf is read from .ai/models.conf (project) then ~/.ai-team/models.conf.
set -uo pipefail
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 2
KIT_HOME="${AI_TEAM_HOME:-$HOME/.ai-team}"
WORKER="${1:?worker required: agy|opencode}"
ID="${2:?task id required, e.g. T01}"
MINS="${3:-20}"
MODEL="${4:-auto}"
TASK=".ai/tasks/$ID.md"
REPORT=".ai/reports/$ID.md"
LOG=".ai/logs/$ID.$WORKER.log"
PROMPT_FILE=".ai/prompts/$ID.md"
ST=".ai/scripts/status.sh"; [ -x "$ST" ] || ST="$KIT_HOME/status.sh"
mkdir -p .ai/reports .ai/logs .ai/research .ai/prompts
[ -f "$TASK" ] || { echo "ERROR: missing $TASK"; exit 2; }
case "$WORKER" in agy|opencode) ;; *) echo "ERROR: worker must be agy or opencode"; exit 2;; esac
command -v "$WORKER" >/dev/null || { echo "ERROR: $WORKER not installed"; exit 2; }
rm -f "$REPORT"
ev() { [ -x "$ST" ] && "$ST" "$@" >/dev/null 2>&1 || true; }
SDIR="$( [ -x "$ST" ] && "$ST" --dir 2>/dev/null || true )"; [ -n "$SDIR" ] || SDIR=".ai/logs"
HB="$SDIR/hb-$WORKER.js"
TITLE="$(head -n 1 "$TASK" | sed 's/^#* *//; s/^'"$ID"': *//')"
BR="$(git symbolic-ref --short -q HEAD 2>/dev/null || true)"; BR="${BR:--}"

# ---- model selection ----
conf() { # conf <key> -> value (project file wins)
  local f v
  for f in ".ai/models.conf" "$KIT_HOME/models.conf"; do
    [ -f "$f" ] || continue
    v="$(grep -m1 "^[[:space:]]*$1[[:space:]]*=" "$f" 2>/dev/null | cut -d= -f2- | sed 's/[[:space:]]*#.*$//; s/^[[:space:]]*//; s/[[:space:]]*$//')"
    [ -n "$v" ] && { printf '%s' "$v"; return 0; }
  done
  return 0
}
field() { grep -m1 -i "^$1:" "$TASK" 2>/dev/null | cut -d: -f2- | sed 's/^[[:space:]]*//; s/[[:space:]].*$//' | tr '[:upper:]' '[:lower:]'; }
TYPE="$(field Type)"; TYPE="${TYPE:-code}"
MODEL_SRC="argument"
if [ -z "$MODEL" ] || [ "$MODEL" = "auto" ]; then
  MODEL="$(grep -m1 -i '^Model:' "$TASK" 2>/dev/null | cut -d: -f2- | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"; MODEL_SRC="task file"
  case "$MODEL" in ""|auto|AUTO|"<"*) MODEL="$(conf "$WORKER.$TYPE")"; MODEL_SRC="models.conf $WORKER.$TYPE";; esac
  [ -n "$MODEL" ] || { MODEL="$(conf "$WORKER.default")"; MODEL_SRC="models.conf $WORKER.default"; }
  [ -n "$MODEL" ] || MODEL_SRC="CLI default"
fi
FALLBACKS="$(conf "$WORKER.fallback")"
EXTRA="$(conf "$WORKER.args")"

{
  cat .ai/WORKER_RULES.md 2>/dev/null || cat .ai/AGY_RULES.md 2>/dev/null
  echo
  echo "You are worker: $WORKER"
  echo "Project root (your working directory): $ROOT"
  echo "Read .ai/PLAN.md for architecture context if needed."
  echo
  echo "=== TASK ==="
  cat "$TASK"
  echo
  echo "=== OUTPUT ==="
  echo "When finished, write your report to $REPORT using .ai/templates/report.md (max 30 lines). Set 'Worker: $WORKER'."
} >"$PROMPT_FILE"

TO="$(command -v timeout || command -v gtimeout || true)"
wrap() { if [ -n "$TO" ]; then "$TO" "${MINS}m" "$@"; else "$@"; fi; }

ATT=0
run_once() { # run_once <model-or-empty>
  local m="$1"
  ATT="$(wc -c <"$LOG" 2>/dev/null | tr -d ' ')"; ATT="${ATT:-0}"
  echo "--- attempt: worker=$WORKER model=${m:-<cli default>} ---" >>"$LOG"
  case "$WORKER" in
    agy)
      local A=(--add-dir "$ROOT" --dangerously-skip-permissions --output-format json)
      [ -n "$m" ] && A+=(--model "$m")
      # shellcheck disable=SC2206
      [ -n "$EXTRA" ] && A+=($EXTRA)
      wrap agy "${A[@]}" <"$PROMPT_FILE" >>"$LOG" 2>&1
      ;;
    opencode)
      local A=(run)
      [ -n "$m" ] && A+=(--model "$m")   # format: provider/model
      # shellcheck disable=SC2206
      [ -n "$EXTRA" ] && A+=($EXTRA)
      A+=("Read the file $PROMPT_FILE and carry out every instruction in it exactly. Working directory: $ROOT")
      wrap opencode "${A[@]}" </dev/null >>"$LOG" 2>&1
      ;;
  esac
}
# only the current attempt's tail is inspected, so words like "quota" in older output or in code do not count
att_tail() { tail -c "+$((ATT+1))" "$LOG" 2>/dev/null | tail -n 40; }
quota_hit() { att_tail | grep -Eiq '(quota|usage limit|rate limit).{0,40}(exceed|exhaust|reach|hit)|(exceed|exhaust|reach|hit|out of).{0,40}(quota|usage limit)|rate.?limit(ed)?([^a-z]|$)|too many requests|resource.?exhausted|(^|[^0-9])429([^0-9]|$)|insufficient.?(credit|balance)'; }
bad_model() { [ -n "$1" ] && att_tail | grep -Eiq 'unknown model|invalid model|model.{0,40}(not found|not available|not supported|does not exist)'; }

heartbeat() {
  while :; do
    local b last
    b=$(wc -c <"$LOG" 2>/dev/null | tr -d ' '); b=${b:-0}
    last=$(tail -n 1 "$LOG" 2>/dev/null | tail -c 160 | tr '\n\r\t' '   ' | sed 's/\\/\\\\/g; s/"/\\"/g')
    printf 'window.AI_HB=window.AI_HB||{};AI_HB["%s"]={t:%s,k:"%s",b:%s,last:"%s",br:"%s"};\n' \
      "$WORKER" "$(date +%s)" "$ID" "$b" "$last" "$BR" >"$HB.tmp" 2>/dev/null && mv -f "$HB.tmp" "$HB"
    sleep 10
  done
}

: >"$LOG"
ev claude assigning "$ID" "$TITLE → $WORKER"
ev "$WORKER" working "$ID" "$TITLE${MODEL:+ · $MODEL}" "$MINS"
heartbeat & HBPID=$!
trap 'kill $HBPID 2>/dev/null; rm -f "$HB" "$HB.tmp"' EXIT

USED="$MODEL"
run_once "$MODEL"
if [ ! -f "$REPORT" ] && bad_model "$MODEL"; then
  echo "--- model '$MODEL' rejected, retrying with CLI default ---" >>"$LOG"
  USED=""; run_once ""
elif [ ! -f "$REPORT" ] && ! quota_hit; then
  echo "--- retry ---" >>"$LOG"
  run_once "$USED"
fi
if [ ! -f "$REPORT" ] && quota_hit; then
  for FB in $FALLBACKS; do
    [ "$FB" = "$USED" ] && continue
    ev "$WORKER" working "$ID" "$TITLE · quota → $FB" "$MINS"
    USED="$FB"; run_once "$FB"
    [ -f "$REPORT" ] && break
    quota_hit || break
  done
fi

if [ -f "$REPORT" ]; then
  RS="$(grep -m1 -i '^Status:' "$REPORT" | tr '[:lower:]' '[:upper:]')"
  case "$RS" in
    *BLOCKED*) ev "$WORKER" blocked "$ID" "$(grep -m1 -i '^Questions' "$REPORT" | cut -d: -f2-)";;
    *PARTIAL*) ev "$WORKER" partial "$ID" "$TITLE";;
    *)         ev "$WORKER" delivered "$ID" "$TITLE";;
  esac
  ev claude reviewing "$ID" "$TITLE"
  echo "OK ($WORKER, model: ${USED:-cli default} [$MODEL_SRC]): $REPORT"
  head -n 40 "$REPORT"
  echo "--- diff stat ---"
  git diff --stat 2>/dev/null | tail -n 30
elif quota_hit; then
  ev "$WORKER" quota "$ID" "usage/rate limit"
  echo "QUOTA: $WORKER hit a usage/rate limit (last model: ${USED:-cli default}). Last log lines:"
  tail -n 8 "$LOG"
  exit 3
else
  ev "$WORKER" failed "$ID" "no report"
  echo "FAILED ($WORKER, model: ${USED:-cli default}): no report. Last log lines:"
  tail -n 20 "$LOG"
  exit 1
fi
