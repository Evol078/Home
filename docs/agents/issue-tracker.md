# Issue tracker: GitHub

Issues and specs live in Evol078/Home GitHub Issues. Use the gh CLI from this repository.

## Conventions

- Before creating an issue, verify the target with `gh repo view --json nameWithOwner`.
- Create: `gh issue create --repo Evol078/Home --title "..." --body-file <file>`.
- Read: `gh issue view <number> --repo Evol078/Home --json number,title,body,labels,comments`.
- List: `gh issue list --repo Evol078/Home --state open --json number,title,body,labels`.
- Comment: `gh issue comment <number> --repo Evol078/Home --body-file <file>`.
- Labels: `gh issue edit <number> --repo Evol078/Home --add-label "..."` or `--remove-label "..."`.
- Close: comment with the outcome, then `gh issue close <number> --repo Evol078/Home`.
- Sub-issues: use GitHub native sub-issues when supported. Otherwise put `Part of #<parent>` in the child and a task list in the parent.
- Blocking: use GitHub native issue dependencies when supported. Otherwise put `Blocked by: #<number>` in the issue body. Work starts after every blocker closes.
- Existing `.scratch/` tickets remain historical records; new tickets go to GitHub.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a GitHub issue in Evol078/Home.

## When a skill says "fetch the relevant ticket"

Read the GitHub issue, including its comments and labels.

## Wayfinding operations

- Map: a GitHub issue labelled `wayfinder:map`, containing Notes, Decisions-so-far and Fog.
- Child: a sub-issue labelled `wayfinder:<type>` (research, prototype, grilling, task). Use a parent task list when native sub-issues are unavailable.
- Frontier: open children, in map order, with no assignee and no open blockers.
- Claim: assign the issue to the driving developer before working.
- Resolve: comment with the answer, close the child, then update Decisions-so-far on the map.

## CLI availability

If gh is unavailable, use the official GitHub REST API with the existing Git credential manager, as approved for this repository. Keep credentials in process memory and omit them from logs. Verify the repository full_name before writes. Use the corresponding repository issues, labels and issue-dependency endpoints.
