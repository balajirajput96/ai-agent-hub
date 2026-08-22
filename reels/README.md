# 3,000 Hindi Research Reels — Durable Production Workflow

## Purpose and scope

This catalog governs a **3,000-item Hindi short-form education series** across psychology, neuroscience, consciousness, learning, emotions, habits, meditation, decision-making, and adjacent philosophical topics. Each reel is treated as a separate, verifiable production record. A reel is never marked complete merely because it has a draft, a rendered clip, or a local file.

## Storage hierarchy

The verified primary Drive folder is `3000_HINDI_RESEARCH_REELS` (`1EW5V1O8l2pKWNngyGIEwgCAOJvugiXmU`). It contains 100 verified batch folders, `Batch_001` through `Batch_100`, each reserved for 30 numbered reels. `Batch_001` is mapped to Reel 0001–0030, `Batch_002` to Reel 0031–0060, and so on. Reel 0001’s verified batch folder is `Batch_001` (`1585_x-GJem9bYkk31DkGGBwnAI_TXCep`).

| Item          | Durable record                                               | Completion condition                                                                         |
| ------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Research      | `REEL_####_RESEARCH.md` plus a `research` asset row          | Sources distinguish evidence, hypothesis, expert view, and belief; claims are cross-checked. |
| Script        | Catalog `scriptText`, caption copy, and a `script` asset row | Hindi narration fits the allotted duration and makes no unsupported claim.                   |
| Visual plan   | Catalog `visualPlan`                                         | Every visual is 9:16, text-safe, and linked to a narration span.                             |
| Voice         | `voice` asset row                                            | Hindi narration is intelligible, complete, and synchronized.                                 |
| Video         | `video` asset row                                            | Render is vertical, approximately 60 seconds, captioned, and passes visual/audio QC.         |
| Drive package | `metadata` asset row                                         | Drive item ID, parent batch folder, and retrievable metadata are recorded.                   |

## Required quality gates

| Gate               | Required check                                                                                                                | Failure disposition                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Evidence           | Each factual claim cites a credible source; research labels science, expert opinion, philosophy, and spirituality separately. | Return to research.                      |
| Editorial          | No fabricated credentials, statistics, quotes, citations, testimonials, or clinical promises.                                 | Rewrite script.                          |
| Voice and captions | Spoken Hindi and captions match substantively; captions remain readable in a mobile safe zone.                                | Regenerate or re-edit the affected span. |
| Visual             | 9:16 upright image, no unintended text/logos/watermarks, visual sequence supports the claim.                                  | Regenerate the affected asset.           |
| Delivery           | Drive upload exists under the mapped batch, Drive metadata is read back, and all asset rows are marked verified.              | Keep status below `uploaded`.            |

## Status model

`research_ready` means evidence is stored. `script_ready` means the script and plan are ready but media has not passed QC. `media_blocked` records a real capacity or provider obstacle. `qc_pending` is used only after all candidate media exists. `qc_passed` requires all quality gates other than upload. `uploaded` requires verified Drive metadata. `failed` requires an explicit non-secret failure explanation and a next action.

## Scheduling boundary

The existing daily GitHub and Drive summary remains **read-only** and separate. The existing hourly continuation remains a **bounded website-health control**. Neither may be repurposed for generating reels or writing Drive files. A future production continuation requires its own deployed, credential-safe execution path with idempotent queue ownership and verified Drive write capability; it must not rely on the interactive sandbox or pass connector credentials into source control.

## Batch continuation rule

The next item is always the lowest reel number not in `uploaded` status after its prior record has been loaded. Production failures must remain visible as `media_blocked` or `failed`; they must not be silently skipped. Reels are never regenerated after an `uploaded` record exists unless a replacement is explicitly tracked as a new asset revision.
