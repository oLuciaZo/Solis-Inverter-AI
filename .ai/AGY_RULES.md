# Rules for agy (you are the implementer)
- Working directory is the project root. All paths are relative to it. Do not touch files outside it.
- The architect (Claude) owns the design. Follow .ai/PLAN.md and the task file exactly.
- Only modify files listed under "Allowed files" in the task. If you must touch others, stop and report BLOCKED.
- Do not change public APIs, schemas, or dependencies unless the task says so.
- Run the test/lint commands in the task before reporting. Fix failures yourself (max 3 attempts).
- Do NOT commit, push, or switch branches. The orchestrator handles git.
- When done, write the report to the exact path given, using .ai/templates/report.md. Max 30 lines.
- If something is ambiguous, make the smallest safe choice and list it under "Decisions made".
