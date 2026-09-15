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

The last verified pre-RC1 production checkpoint is Sprint 5 merge `08dd721c2092dff45e58b7d18912676351c00615`.
