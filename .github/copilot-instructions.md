# Milens — Code Intelligence (MCP)

This project is indexed by milens — a code intelligence engine that provides 32 MCP tools.

> **CRITICAL:** All milens MCP tool calls MUST include the `repo` parameter set to `<workspaceRoot>`.
> **CRITICAL:** Before first use in each session, load milens tools via `tool_search("milens")`.

## Pre-Flight Checklist (MANDATORY)
1. `npx milens analyze -p . -f` — ensure index is fresh
2. Verify milens MCP tools are loaded — if NOT, STOP
3. `mcp_milens_session_start({agent: "copilot", repo: "<workspaceRoot>"})`

## Mandatory Workflows

### Before editing any symbol:
1. `mcp_milens_impact({target: "<symbolName>", repo: "<workspaceRoot>"})`
2. If depth-1 dependents > 5 → STOP and warn
3. `mcp_milens_context({name: "<symbolName>", repo: "<workspaceRoot>"})`
4. Only then make the edit

### Before committing:
`mcp_milens_detect_changes({repo: "<workspaceRoot>"})`

### Before deleting/renaming:
1. `mcp_milens_grep({pattern: "<symbolName>", repo: "<workspaceRoot>"})`
2. `mcp_milens_impact({target: "<symbolName>", direction: "upstream", repo: "<workspaceRoot>"})`

## Never Do
- NEVER edit without `impact()` first
- NEVER delete/rename without `grep()` + `impact()`
- NEVER commit without `detect_changes()`
- NEVER call milens tools without `repo` parameter

## Skills
| Task | Skill file |
|------|-----------|
| milens tools reference | `.agents/skills/milens/SKILL.md` |
| Define spec | `.agents/skills/spec-definer/SKILL.md` |
| Analyze spec & plan | `.agents/skills/spec-analyzer/SKILL.md` |
| Execute task | `.agents/skills/task-executor/SKILL.md` |
| Review code | `.agents/skills/code-reviewer/SKILL.md` |
| Generate docs | `.agents/skills/doc-generator/SKILL.md` |
| Sync spec & config | `.agents/skills/spec-syncer/SKILL.md` |
| Format & lint | `.agents/skills/formatter-linter/SKILL.md` |
| Commit lint | `.agents/skills/commit-linter/SKILL.md` |
| Build prompts (XML) | `.agents/skills/prompt-builder/SKILL.md` |
| End-to-end spec flow | `.agents/skills/spec-flow/SKILL.md` |
