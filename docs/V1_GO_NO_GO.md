# Atlas V1 Go/No-Go Checklist

## Automated and repository gates

- [x] `release.json` identifies `1.0.0`, its September 16 release date, and the October 18 target.
- [x] 33/33 Node tests pass.
- [x] Lesson and knowledge-graph validation passes.
- [x] Generated memory assets are current and match their hashes.
- [x] Required routes, internal links, lesson paths, and module imports resolve.
- [x] English and Spanish complete/restart acceptance flows pass for Lessons 001–004.
- [x] Malformed, legacy, and future-version saved data recover without discarding valid progress.
- [x] Release notes, known limitations, and non-destructive rollback instructions are present.

## Production gates

- [x] RC1 merged into `main` through pull request #10.
- [x] GitHub Pages succeeded for RC1 merge `97fac46`.
- [x] Production learner, memory hub, runtime files, and `release.json` returned successfully.
- [x] Production Chromium smoke test had no Atlas console errors or horizontal overflow.
- [x] Fresh-profile persistence, language switching, completion, restart, and history passed in production.

## Manual device disposition

- [x] Firefox desktop was unavailable; the untested keyboard, persistence, print-preview, and completion risk was explicitly accepted on September 16, 2026.
- [x] Safari/iPhone: portrait layout, text scaling, reduced motion, persistence, and completion. Verified on a physical iPhone on September 15, 2026.
- [x] Chrome/Android was unavailable; the untested portrait layout, text scaling, accessibility-control, and completion risk was explicitly accepted on September 16, 2026.

All V1 go/no-go gates are resolved. Create the public `v1.0.0` tag only after the final release checkpoint is merged and its GitHub Pages deployment succeeds.
