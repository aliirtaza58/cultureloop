# CultureLoop frontend skill integration

Updated 2026-10-18. The user supplied `ui-ux-pro-max-skill-main.zip` and requested its use for CultureLoop's frontend within the existing project scope.

## Installed resources

- Project copy: [UI/UX Pro Max](../skills/ui-ux-pro-max/SKILL.md).
- Codex user installation: `C:/Users/Irtaza/.codex/skills/ui-ux-pro-max/`.
- [Provenance manifest](../skills/ui-ux-pro-max/INSTALLATION.json): source ZIP hash, selected package directory, and portability adaptation.
- [Upstream MIT license](../skills/ui-ux-pro-max/LICENSE) retained.
- Python 3.12.10 is available. The search tool uses the standard library and local data.

The selected package includes its search scripts, data, and two references. Claude-specific example script paths were replaced with an absolute-skill-directory placeholder; use the actual folder containing SKILL.md. No package manager installation or external service is needed for its local searches.

## When to load it

Read the skill before UI structure, interaction, visual design, accessibility, responsive behavior, or frontend review work. Read only the relevant reference sections and targeted search output. Pure matching, API, and database tasks can use the existing build plan without loading the design catalogs.

Follow [AGENTS.md](../AGENTS.md), [build scope](BUILD_PLAN.md), and the free-only budget. Skill recommendations inform implementation; they do not expand the product or authorize spending.

## First visual-design checkpoint

1. Review the user journey and any existing design master.
2. Generate a product-wide recommendation with one dominant query, then inspect whether its product category/style actually fits a community book exchange:

```powershell
python -B "F:\Qloo Hackathon\skills\ui-ux-pro-max\scripts\search.py" "community book exchange" --design-system -p "CultureLoop"
```

3. If off-topic or empty, retry once with a narrower query; do not persist an unverified match. Clearly identify any general fallback guidance.
4. After verifying fit, use `--persist --output-dir "F:\Qloo Hackathon"` to create `design-system/cultureloop/MASTER.md`. Read an existing master first and preserve it; do not use `--force` without the explicit authorization the skill requires.
5. Confirm the actual installed frontend stack before running a stack query. Next.js/TypeScript is the planned stack; no package.json currently establishes an implemented stack.
6. Derive reusable color, typography, spacing, component, and interaction tokens from the reviewed master. Page overrides cover a real screen-specific need; they must preserve product constraints.

The design master remains a future P1 deliverable. This checkpoint installs and connects the skill, with no application UI built yet.

## Product boundaries and required screens

| Screen or state | Design purpose |
| --- | --- |
| Start/example | Explain the exchange and offer guest example or new-room entry |
| Room/inventory | Join by invitation; show physical copies, ownership, availability, and capacity |
| Favorites | Search and confirm canonical cultural identities; handle ambiguity |
| Exchange proposal | Show give/receive transfers, evidence origin, and member decisions |
| Decline/withdraw/repair | Explain affected transfers, preserve useful state, show revised approvals |
| Agreement/export | Show the unanimously accepted revision and actual item holds |

Keep the room limits, two-/three-person cycles, and participant approvals already specified. Do not add checkout, shipping, social feeds, paid dashboards, or speculative metrics through design templates.

## CultureLoop design requirements

- Make book ownership and give/receive direction immediately legible. The desktop exchange ring has an equivalent ordered mobile list.
- Show synthetic, live, cached, unavailable, loading, empty, error, stale, declined, awaiting-decision, and accepted states truthfully.
- Evidence can expand on demand; raw API implementation details should not obstruct the primary exchange task.
- Provide keyboard operation, visible unobscured focus, named controls, visible input labels, meaningful feedback, and touch targets of at least 44 by 44 pixels where practical.
- Use readable contrast, text/icons alongside status colors, resilient book-title wrapping, and reduced-motion support. Layout must accommodate long titles and narrow viewports.
- Use a coherent token system and consistent SVG icons. Prefer CSS/SVG/book placeholders and verified licensed assets that work within the free-only budget.
- Persisting a design recommendation is not browser verification. Check actual desktop/mobile layouts and interaction states once the application exists, then apply the relevant skill delivery checklist.

## Verification performed

- Archive paths constrained to the intended workspace folder; selected entries contain no symlinks.
- 73 upstream package files plus license and provenance manifest prepared; all 75 installed files matched project-copy hashes at installation.
- Local search for `focus not obscured` in the explicit UX domain returned two relevant web accessibility entries.
- Installed-copy search also passed with two relevant results. Project-document checks are recorded in the tracker.
