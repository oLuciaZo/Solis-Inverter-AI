#!/usr/bin/env bash
# AI Team Kit v2 — status.sh
# usage: status.sh <actor> <state> [task_id] [message] [timeout_min]   append one event
#        status.sh plan      re-read .ai/PLAN.md + .ai/STATUS.md into plan.js (totals for the % bar)
#        status.sh --dir     print this repo's state directory
#   actor : claude | agy | opencode
#   state : planning | assigning | waiting | reviewing | done | fix | idle      (claude)
#           working | delivered | partial | blocked | failed | quota | idle    (worker)
# State lives OUTSIDE the repo, in ~/.ai-team/state/<repo-id>/, so git switch / reset / clean
# can never rewind it. Every event records the current branch.
set -u
KIT_HOME="${AI_TEAM_HOME:-$HOME/.ai-team}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

state_dir() {
  local cd key name h
  cd="$(git -C "$ROOT" rev-parse --git-common-dir 2>/dev/null || true)"
  if [ -n "$cd" ]; then
    cd="$(cd "$ROOT" 2>/dev/null && cd "$cd" 2>/dev/null && pwd -P)"
  fi
  if [ -n "$cd" ]; then
    key="$cd"
    case "$cd" in */.git) name="$(basename "$(dirname "$cd")")";; *) name="$(basename "$ROOT")";; esac
  else
    key="$ROOT"; name="$(basename "$ROOT")"
  fi
  h="$(printf '%s' "$key" | git hash-object --stdin 2>/dev/null | cut -c1-8)"
  [ -n "$h" ] || h="$(printf '%s' "$key" | cksum | cut -d' ' -f1)"
  NAME="$name"
  printf '%s/state/%s-%s' "$KIT_HOME" "$(printf '%s' "$name" | tr -c 'A-Za-z0-9._-' '_')" "$h"
}
branch() {
  local b
  b="$(git -C "$ROOT" symbolic-ref --short -q HEAD 2>/dev/null)"
  [ -n "$b" ] || b="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null | sed 's/^/detached@/')"
  printf '%s' "${b:--}"
}
esc() { printf '%s' "$1" | tr '\n\r\t' '   ' | sed 's/\\/\\\\/g; s/"/\\"/g'; }

NAME=""
DIR="$(state_dir)"; state_dir >/dev/null   # second call sets NAME in this shell
mkdir -p "$DIR"
F="$DIR/status.js"

sync_plan() {
  local plan="$ROOT/.ai/PLAN.md" st="$ROOT/.ai/STATUS.md" tmp="$DIR/plan.js.tmp.$$" tasks="" done_ids="" cur=""
  if [ -f "$plan" ]; then
    tasks="$(awk '
      function clean(s){ gsub(/[\\"\r\t]/," ",s); gsub(/[`*]/,"",s); gsub(/^[] :.)-]+/,"",s); while (sub(/^(—|–)[ :-]*/,"",s)) ; gsub(/[ |]+$/,"",s); gsub(/  +/," ",s); return s }
      /^#+[ \t]/ { if (match($0,/M[0-9]+/)) { ms=substr($0,RSTART,RLENGTH) } }
      {
        l=$0; chk=0; mk=0
        if (l ~ /\[[xX]\]/) chk=1
        sub(/^[ \t]*/,"",l)
        while (l ~ /^([-*+|#>]|[0-9]+[.)]|\[[ xX]\]|\*\*|`)[ \t]*/) { mk=1; sub(/^([-*+|#>]|[0-9]+[.)]|\[[ xX]\]|\*\*|`)[ \t]*/,"",l) }
        if (match(l,/^T[0-9][0-9]+/)) {
          id=substr(l,1,RLENGTH); rest=substr(l,RLENGTH+1)
          if (rest ~ /^[A-Za-z0-9_]/) next
          if (!mk && rest !~ /^[ \t]*:/) next
          if (id in seen) next
          seen[id]=1
          p=index(rest,"|"); if (p>1 && $0 ~ /^[ \t]*\|/) { rest=substr(rest,p+1); q=index(rest,"|"); if (q>0) rest=substr(rest,1,q-1) }
          printf "%s{id:\"%s\",title:\"%s\",ms:\"%s\",x:%d}", (n++?",":""), id, clean(rest), ms, chk
        }
      }' "$plan" 2>/dev/null)"
  fi
  if [ -f "$st" ]; then
    done_ids="$(grep -i -m1 '^[#* ]*Done[* ]*:' "$st" 2>/dev/null | grep -o 'T[0-9][0-9]*' | sort -u | sed 's/.*/"&"/' | paste -sd, -)"
    cur="$(grep -i -m1 '^[#* ]*Current milestone' "$st" 2>/dev/null | cut -d: -f2- | sed 's/Branch:.*//; s/^[[:space:]]*//; s/[[:space:]]*$//')"
  fi
  printf 'window.AI_PLAN={t:%s,b:"%s",project:"%s",cur:"%s",tasks:[%s],done:[%s]};\n' \
    "$(date +%s)" "$(esc "$(branch)")" "$(esc "$NAME")" "$(esc "$cur")" "$tasks" "$done_ids" >"$tmp" 2>/dev/null \
    && mv -f "$tmp" "$DIR/plan.js"
}

case "${1:-}" in
  --dir) printf '%s\n' "$DIR"; exit 0;;
  plan)  sync_plan; exit 0;;
  "")    echo "usage: status.sh <actor> <state> [task_id] [message] [timeout_min] | plan | --dir" >&2; exit 2;;
esac

if [ ! -f "$F" ]; then
  printf 'window.AI_EVENTS=window.AI_EVENTS||[];window.AI_PROJECT="%s";\n' "$(esc "$NAME")" >"$F"
fi
N="${5:-0}"; case "$N" in ''|*[!0-9]*) N=0;; esac
printf 'AI_EVENTS.push({t:%s,a:"%s",s:"%s",k:"%s",m:"%s",n:%s,b:"%s"});\n' \
  "$(date +%s)" "$(esc "$1")" "$(esc "${2:?state}")" "$(esc "${3:--}")" "$(esc "${4:-}")" "$N" "$(esc "$(branch)")" >>"$F"
sync_plan
