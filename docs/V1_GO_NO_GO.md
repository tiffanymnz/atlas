# Atlas V1 Go/No-Go Checklist

## Automated and repository gates

- [x] `release.json` identifies `1.0.0-rc.1` and the October 18 target.
- [x] 33/33 Node tests pass.
- [x] Lesson and knowledge-graph validation passes.
- [x] Generated memory assets are current and match their hashes.
- [x] Required routes, internal links, lesson paths, and module imports resolve.
- [x] English and Spanish complete/restart acceptance flows pass for Lessons 001–004.
- [x] Malformed, legacy, and future-version saved data recover without discarding valid progress.
- [x] Release notes, known limitations, and non-destructive rollback instructions are present.

## Production gates

- [ ] RC1 is merged into `main` through a pull request.
- [ ] GitHub Pages succeeds for the RC1 merge SHA.
- [ ] Production learner, memory hub, runtime files, and `release.json` return successfully.
- [ ] Production Chromium smoke test has no Atlas console errors or horizontal overflow.
- [ ] Fresh-profile persistence, language switching, completion, restart, and history pass in production.

## Manual device sign-off before `v1.0.0`

- [ ] Firefox desktop: keyboard, persistence, print preview, and completion.
- [x] Safari/iPhone: portrait layout, text scaling, reduced motion, persistence, and completion. Verified on a physical iPhone on September 15, 2026.
- [ ] Chrome/Android: portrait layout, text scaling, keyboard/accessibility controls where applicable, and completion.

Create the `v1.0.0` tag only after every production gate passes and any unavailable manual device checks are explicitly accepted as release risk.
