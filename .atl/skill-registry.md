# Skill Registry — Proactrip Frontend

Generated: 2026-05-17 | SDD init
Stored at: `.atl/skill-registry.md`

## Coverage

- **Project skills**: 0 (none in project directories)
- **User skills**: 39 (from ~/.agents/skills/, ~/.config/opencode/skills/, ~/.claude/skills/)
- **SDD phases**: 8 (sdd-init, sdd-explore, sdd-propose, sdd-spec, sdd-design, sdd-tasks, sdd-apply, sdd-verify, sdd-archive)
- **Convention files**: AGENTS.md (root workspace: /home/aurelio/Proactrip)

## Design & UI Skills

### adapt
- **Trigger**: responsive design, mobile layouts, breakpoints, viewport adaptation, cross-device compatibility
- **Path**: ~/.agents/skills/adapt/SKILL.md
- **Compact rules**: Mobile-first with single column stacking. Touch targets ≥44px. Fluid typography with clamp(). Respect prefers-reduced-motion. Never use h-screen (use min-h-[100dvh]). Adapt for input method and connection speed.

### animate
- **Trigger**: animation, transitions, micro-interactions, motion design, hover effects
- **Path**: ~/.agents/skills/animate/SKILL.md
- **Compact rules**: Animate transform/opacity only (GPU-composited). Respect prefers-reduced-motion. One hero animation per page. Duration 150-400ms for micro-interactions, 400-800ms for page transitions. Easing: ease-out for entering, ease-in for exiting.

### audit
- **Trigger**: accessibility check, performance audit, technical quality review
- **Path**: ~/.agents/skills/audit/SKILL.md
- **Compact rules**: 5 dimensions scored 0-4: A11y, Performance, Theming, Responsive, Anti-patterns. P0 (blocking) to P3 (minor). Do NOT fix — document issues for other commands. WCAG AA minimum target.

### bolder
- **Trigger**: design bland, generic, too safe, lacks personality, more visual impact
- **Path**: ~/.agents/skills/bolder/SKILL.md
- **Compact rules**: Increase contrast and scale. Amplify existing design direction without changing it. Bolder typography, stronger color accents. Do NOT add unrelated decorative elements.

### clarify
- **Trigger**: confusing text, unclear labels, bad error messages, hard-to-follow instructions
- **Path**: ~/.agents/skills/clarify/SKILL.md
- **Compact rules**: Specific > generic. Lead with outcome. Error messages: what happened + why + what to do next. Labels match user's mental model. Test with "would my mom understand this?"

### colorize
- **Trigger**: design gray, dull, lacking warmth, needing more color
- **Path**: ~/.agents/skills/colorize/SKILL.md
- **Compact rules**: Strategic color placement, not rainbow. Add 1-2 accent colors max. Use existing palette. Color as information, not decoration. Preserve contrast ratios.

### critique
- **Trigger**: review, critique, evaluate design or component
- **Path**: ~/.agents/skills/critique/SKILL.md
- **Compact rules**: Visual hierarchy, IA, emotional resonance, cognitive load. Quantitative scoring + persona testing + anti-pattern detection. 5 dimensions scored. Actionable feedback only.

### delight
- **Trigger**: polish, personality, animations, micro-interactions, make UI fun/memorable
- **Path**: ~/.agents/skills/delight/SKILL.md
- **Compact rules**: Joy moments must be skippable. Respect reduced motion. No feature should depend on delight. Sprinkle, don't drown. Test on real devices.

### design-taste-frontend
- **Trigger**: ALWAYS ACTIVE when writing frontend code
- **Path**: ~/.agents/skills/design-taste-frontend/SKILL.md
- **Compact rules**: Check package.json before importing ANY library. NEVER use emojis in code/markup. RSC safety: interactive UI as isolated 'use client' leaf components. Tailwind v3/v4 version lock: check package.json first. Grid over flex-math. min-h-[100dvh] not h-screen. Max 1 accent color, saturation <80%. No AI purple/blue aesthetic.

### distill
- **Trigger**: simplify, declutter, reduce noise, remove elements, cleaner UI
- **Path**: ~/.agents/skills/distill/SKILL.md
- **Compact rules**: Remove before adding. One primary action per view. Progressive disclosure. White space is a design element. Every element must justify its existence.

### emil-design-eng
- **Trigger**: UI polish, component design, animation decisions
- **Path**: ~/.agents/skills/emil-design-eng/SKILL.md
- **Compact rules**: Animation as functional communication, not decoration. Springs > easings for natural feel. Composed components with clean APIs. Every state accounted for (loading, empty, error, success).

### high-end-visual-design
- **Trigger**: premium design, high-end agency aesthetic
- **Path**: ~/.agents/skills/high-end-visual-design/SKILL.md
- **Compact rules**: Strict typography scale. Custom spacing tokens (not Tailwind defaults). Subtle shadows with layered depth. No generic AI aesthetics. Card structures with intentional hierarchy.

### impeccable
- **Trigger**: build web components, pages, artifacts, or any design skill needs project context
- **Path**: ~/.agents/skills/impeccable/SKILL.md
- **Compact rules**: Context Gathering Protocol REQUIRED before any design work. Check .impeccable.md or run 'teach' command. No generic AI slop. Bold aesthetic direction. Anti-pattern detection. Production-grade code output.

### industrial-brutalist-ui
- **Trigger**: data-heavy dashboards, declassified blueprint aesthetic
- **Path**: ~/.agents/skills/industrial-brutalist-ui/SKILL.md
- **Compact rules**: Rigid grids. Extreme type scale contrast. Utilitarian color palette. Analog degradation effects. Swiss typography + military terminal aesthetic.

### layout
- **Trigger**: layout feeling off, spacing issues, visual hierarchy, crowded UI, alignment problems
- **Path**: ~/.agents/skills/layout/SKILL.md
- **Compact rules**: Consistent spacing scale (4px base). Grid over flexbox for multi-column. Visual hierarchy through size, weight, and position. White space ratios intentional. Alignment checked to pixel.

### minimalist-ui
- **Trigger**: clean editorial-style interfaces
- **Path**: ~/.agents/skills/minimalist-ui/SKILL.md
- **Compact rules**: Warm monochrome palette. Typographic contrast. Flat bento grids. Muted pastels. No gradients, no heavy shadows.

### optimize
- **Trigger**: slow, laggy, janky, performance, bundle size, load time
- **Path**: ~/.agents/skills/optimize/SKILL.md
- **Compact rules**: Animate only transform/opacity. Lazy load off-screen content. Image optimization (next/image). Code splitting. Avoid layout thrashing. Profile before optimizing.

### overdrive
- **Trigger**: wow, impress, go all-out, extraordinary
- **Path**: ~/.agents/skills/overdrive/SKILL.md
- **Compact rules**: Shaders, spring physics, scroll-driven reveals, 60fps. Technically ambitious. Must still be performant. Progressive enhancement baseline.

### polish
- **Trigger**: polish, finishing touches, pre-launch review, good to great
- **Path**: ~/.agents/skills/polish/SKILL.md
- **Compact rules**: LAST step only. Find design system first. Fix alignment ±1px. Consistent spacing. Complete state coverage (loading, empty, error). Copy consistency. Edge cases handled.

### quieter
- **Trigger**: too bold, too loud, overwhelming, aggressive, garish
- **Path**: ~/.agents/skills/quieter/SKILL.md
- **Compact rules**: Reduce saturation. Lower contrast. Fewer competing elements. Calmer rhythm. Preserve quality while reducing intensity.

### redesign-existing-projects
- **Trigger**: upgrade existing websites/apps to premium quality
- **Path**: ~/.agents/skills/redesign-existing-projects/SKILL.md
- **Compact rules**: Audit current design first. Identify generic AI patterns. Apply high-end standards without breaking functionality. Works with any CSS framework.

### shape
- **Trigger**: planning phase, UX/UI design brief before coding
- **Path**: ~/.agents/skills/shape/SKILL.md
- **Compact rules**: Structured discovery interview first. Design brief before code. Establish direction, constraints, strategy. No implementation during shape phase.

### stitch-design-taste
- **Trigger**: Google Stitch design system, premium anti-generic UI standards
- **Path**: ~/.agents/skills/stitch-design-taste/SKILL.md
- **Compact rules**: Strict typography. Calibrated color. Asymmetric layouts. Perpetual micro-motion. Hardware-accelerated performance. Generates DESIGN.md files.

### typeset
- **Trigger**: fonts, type, readability, text hierarchy, sizing looks off
- **Path**: ~/.agents/skills/typeset/SKILL.md
- **Compact rules**: Max 2 font families. Modular scale for sizes. Line-height 1.2-1.5 for headings, 1.5-1.75 for body. Max 65ch line length. Consistent weight hierarchy.

## Workflow & Git Skills

### branch-pr
- **Trigger**: creating, opening, or preparing PRs for review
- **Path**: ~/.config/opencode/skills/branch-pr/SKILL.md
- **Compact rules**: Every PR MUST link approved issue. Exactly one type:* label. Conventional commits. Branch naming: type/description. Automated checks must pass before merge.

### chained-pr
- **Trigger**: PRs over 400 lines, stacked PRs, review slices
- **Path**: ~/.config/opencode/skills/chained-pr/SKILL.md
- **Compact rules**: Split PRs over 400 lines. Each PR reviewable in ≤60 min. One deliverable work unit per PR. Tests/docs with the unit they verify. Dependency diagram in each PR. Feature Branch Chain with tracker PR.

### work-unit-commits
- **Trigger**: implementation, commit splitting, chained PRs, tests and docs with code
- **Path**: ~/.config/opencode/skills/work-unit-commits/SKILL.md
- **Compact rules**: Commit by work unit, not file type. Tests in same commit as behavior. Docs with user-visible change. Tell a story. Each commit is a deliverable behavior.

### comment-writer
- **Trigger**: PR feedback, issue replies, reviews, GitHub comments
- **Path**: ~/.config/opencode/skills/comment-writer/SKILL.md
- **Compact rules**: Lead with actionable point. Warm and direct. 1-3 short paragraphs or bullets. Explain why when requesting change. Match thread language.

### cognitive-doc-design
- **Trigger**: writing guides, READMEs, RFCs, onboarding, architecture docs
- **Path**: ~/.config/opencode/skills/cognitive-doc-design/SKILL.md
- **Compact rules**: Lead with answer. Progressive disclosure. Chunk information. Signpost with headings. Recognition over recall. Tables/checklists over dense prose.

### issue-creation
- **Trigger**: creating GitHub issues, bug reports, feature requests
- **Path**: ~/.config/opencode/skills/issue-creation/SKILL.md (or ~/.claude/skills/)
- **Compact rules**: Issue-first workflow. Clear repro steps for bugs. Acceptance criteria for features. One concern per issue.

### judgment-day
- **Trigger**: judgment day, dual review, adversarial review
- **Path**: ~/.config/opencode/skills/judgment-day/SKILL.md (or ~/.claude/skills/)
- **Compact rules**: Blind dual review. Fix confirmed issues. Re-judge after fixes. Adversarial perspective testing.

## Communication & Efficiency Skills

### caveman
- **Trigger**: caveman mode, less tokens, be brief, token efficiency
- **Path**: ~/.agents/skills/caveman/SKILL.md
- **Compact rules**: Drop articles, filler, hedging. Fragments OK. Technical terms exact. Levels: lite, full, ultra. Stays active until "stop caveman" or "normal mode".

### caveman-commit
- **Trigger**: write a commit, commit message, generate commit, staging changes
- **Path**: ~/.agents/skills/caveman-commit/SKILL.md
- **Compact rules**: Conventional Commits format. Subject ≤50 chars. Body only when "why" not obvious. Ultra-compressed.

### caveman-compress
- **Trigger**: compress memory file (CLAUDE.md, todos, preferences)
- **Path**: ~/.agents/skills/caveman-compress/SKILL.md
- **Compact rules**: Compress to caveman format. Preserve technical substance, code, URLs, structure. Backup as FILE.original.md.

### caveman-help
- **Trigger**: /caveman-help, caveman help, how to use caveman
- **Path**: ~/.agents/skills/caveman-help/SKILL.md
- **Compact rules**: One-shot quick reference card. Not persistent mode.

### caveman-review
- **Trigger**: review PR, code review, review the diff
- **Path**: ~/.agents/skills/caveman-review/SKILL.md
- **Compact rules**: One line per comment: location, problem, fix. Ultra-compressed review format.

### find-skills
- **Trigger**: how do I do X, find a skill for X, is there a skill that can...
- **Path**: ~/.agents/skills/find-skills/SKILL.md
- **Compact rules**: Discover and install agent skills. Search available skills. Recommend installations.

### full-output-enforcement
- **Trigger**: any task requiring exhaustive, unabridged output
- **Path**: ~/.agents/skills/full-output-enforcement/SKILL.md
- **Compact rules**: Enforce complete code generation. Ban placeholder patterns. Handle token-limit splits cleanly.

## Design API & Backend Skills (less relevant for frontend, documented for completeness)

### api-rest
- **Trigger**: designing REST APIs, endpoints, error handling, pagination, auth, versioning
- **Path**: ~/.config/opencode/skills/api-rest/SKILL.md
- **Compact rules**: RFC 9457 errors. Consistent pagination. Proper status codes. Version in URL path. HATEOAS optional.

### dragonfly
- **Trigger**: DragonflyDB integration in Go (backend only)
- **Path**: ~/.config/opencode/skills/dragonfly/SKILL.md

### echo
- **Trigger**: Echo v5 web framework for Go (backend only)
- **Path**: ~/.config/opencode/skills/echo/SKILL.md

### go
- **Trigger**: Go code, Go patterns, Go 1.26 (backend only)
- **Path**: ~/.config/opencode/skills/go/SKILL.md

### go-testing
- **Trigger**: Go tests, go test coverage (backend only)
- **Path**: ~/.config/opencode/skills/go-testing/SKILL.md

## SDD Phase Skills (orchestrator-invoked, not user-facing)

| Phase | Path |
|-------|------|
| sdd-init | ~/.config/opencode/skills/sdd-init/SKILL.md |
| sdd-explore | ~/.config/opencode/skills/sdd-explore/SKILL.md |
| sdd-propose | ~/.config/opencode/skills/sdd-propose/SKILL.md |
| sdd-spec | ~/.config/opencode/skills/sdd-spec/SKILL.md |
| sdd-design | ~/.config/opencode/skills/sdd-design/SKILL.md |
| sdd-tasks | ~/.config/opencode/skills/sdd-tasks/SKILL.md |
| sdd-apply | ~/.config/opencode/skills/sdd-apply/SKILL.md |
| sdd-verify | ~/.config/opencode/skills/sdd-verify/SKILL.md |
| sdd-archive | ~/.config/opencode/skills/sdd-archive/SKILL.md |
| sdd-onboard | ~/.config/opencode/skills/sdd-onboard/SKILL.md |
| skill-creator | ~/.config/opencode/skills/skill-creator/SKILL.md |
| skill-registry | ~/.config/opencode/skills/skill-registry/SKILL.md |
