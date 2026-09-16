# Atlas V1 Rollback Procedure

Use a normal Git revert so history and every retained branch remain intact. Do not force-push, reset `main`, or delete the release branch.

1. Confirm the failing production commit and the last successful Pages run.
2. Create a rollback branch from current `main`.
3. Run `git revert <release-merge-sha>` on that branch.
4. Run `npm test` and review the resulting diff.
5. Open and merge a rollback pull request into `main`.
6. Wait for GitHub Pages to complete successfully.
7. Verify `/atlas/`, `/atlas/apps/learner/`, and `/atlas/assets/memory/`.
8. Record the failure, reverted merge SHA, rollback PR, and follow-up issue in the release notes.

The last verified pre-V1 production checkpoint is RC1 merge `97fac464a36cf5a6fba09a1bff281b6ed7cc4268`.
