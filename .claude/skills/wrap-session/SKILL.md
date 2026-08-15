---
name: wrap-session
description: Wrap up a work session on this repo — review what actually changed (git diff + conversation), update whichever markdown docs (an applet's own spec*.md, .claude/rules/*.md, root CLAUDE.md) need to reflect it, then commit and push. Use this whenever the user says something like "let's wrap up", "wrap this session up", "end of session", "let's commit this", "save progress", "checkpoint this", "checkpoint the session", or similar end-of-session language. Also worth proactively suggesting near the end of a long session that has real uncommitted changes.
---

# Wrap Session

Wrapping up is two things, done in this order: bring this repo's own documentation back in sync
with whatever actually happened this session, then commit and push the result. Docs first — a
commit that ships stale docs alongside real changes isn't actually a checkpoint, it's just a save
point that next session will have to reconstruct by re-reading the diff.

## Step 1 — Survey what changed

Run `git status` and `git diff` (staged and unstaged) — this is the ground truth for what changed,
not your memory of the conversation. Then look back through the conversation itself for anything
that wouldn't show up in a diff: a design direction that got tried and rejected, the *why* behind a
decision, an open question left for next time. Good docs capture decisions and reasoning, not just
a restatement of the diff.

## Step 2 — Figure out which docs actually need updating

Most sessions only touch one or two docs — don't update all of these by default, and don't skip
this step either. Check each candidate against what genuinely happened:

- **An applet's own `spec*.md`** (under `Applets/<Course>/<Applet Name>/`) — if any other file in
  that same folder changed this session. This is almost always the right one to update. Per this
  repo's own working agreement (see the `applet-session-start` skill), spec.md is meant to stay
  current incrementally, not get reconstructed from scratch later — write it like the other entries
  already in that file: a decision, then why, in the order things happened.
- **`.claude/rules/applets.md`** — only if a new convention got established that's meant to apply
  *across* applets (a new tileType pattern, a new header/layout rule, a new build-process gotcha) —
  not for something scoped to a single applet.
- **`.claude/rules/wiring.md`** — only if something about how the site's files reference each other
  changed (a new route, a new data-duplication point, a new override mechanism).
- **`.claude/rules/code-style.md`** — only if a new code convention got established this session.
- **Root `CLAUDE.md`** — only for the running branch-summary paragraph at the top (if this branch
  deserves another clause added to it), or if `js/data.js`'s actual schema changed. This file is
  dense and carefully written; keep edits small and surgical, matching its existing voice — don't
  rewrite whole paragraphs.

List what you think needs updating, and why, before editing anything. Flag anything you're unsure
about rather than guessing — silently skipping a doc that needed updating is worse than asking once.

## Step 3 — Make the edits

Match each file's own established voice rather than a generic style. Read a few existing entries in
whichever file you're editing first. Don't invent details that aren't grounded in the actual diff or
conversation — if you're not sure why something changed, ask rather than guess at a reason.

## Step 4 — Review before committing

Show a summary of what's about to be staged (`git status`, `git diff --stat`) and a draft commit
message. Check `git log` for the last several commits and match this repo's existing message style
rather than assuming a format. Wait for the user to confirm before running `git commit`.

## Step 5 — Confirm before pushing

- If the current branch is `main`, stop and say so — this repo lands changes via PRs from feature
  branches, never direct commits to `main` (see `CLAUDE.md` §5, "PR workflow"). Don't push.
- Otherwise, confirm the branch name and that pushing is really wanted, then push normally (use
  `-u origin <branch>` if the branch isn't tracking a remote yet).
- Never use `--no-verify`, never force-push, regardless of how the request is phrased.

## Step 6 — Report back

A short summary: which doc(s) got updated (or "no docs needed updating" if that was genuinely the
case), the commit hash and message, and whether it was pushed — or why not, if you stopped at step 5.

## If there's nothing to do

If `git status` is clean, say so and stop. Don't manufacture doc edits or create an empty commit
just to have something to report.
