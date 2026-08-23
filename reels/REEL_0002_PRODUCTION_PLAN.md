# Reel 0002 Production Blueprint

## Delivery contract

| Field            | Value                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Working title    | हर बार याद करने पर memory क्यों बदल सकती है?                                                                             |
| Reel status      | `research_ready`; **not rendered, not QC-passed, and not uploaded as media**                                             |
| Target format    | 9:16 vertical, approximately 60 seconds, Hindi off-screen narration and Devanagari-first captions                        |
| Evidence class   | Emerging evidence with explicit boundaries                                                                               |
| Drive batch      | `Batch_001` (`1585_x-GJem9bYkk31DkGGBwnAI_TXCep`)                                                                        |
| Visual approach  | Cinematic scientific editorial: annotated-notebook metaphor, teal/cyan/amber palette, no clinical or therapeutic imagery |
| Background music | None for this revision; narration remains the sole audio track                                                           |

## Global visual definition

The primary visual anchor is an open research notebook, a translucent update tab, and a distant abstract brain silhouette. It represents a **metaphor**, not a literal picture of how every memory changes. Visuals must never depict memory erasure, a medical procedure, therapy, trauma, a CCTV camera, a person, or a guaranteed “rewriting” outcome.

The required primary 9:16 reference image was requested at `/home/ubuntu/webdev-static-assets/reel_0002_memory_reconsolidation_primary_reference_v02.png`. At the time this plan was created, it was still generating; no keyframe, motion clip, render, or media-completion state may be created until the actual reference image is available and usable.

## Clip plan

| Time           | Narrative purpose | Scene and action                                                                 | Camera and transition                                                                               | Narration span                                               | Caption concept                        |
| -------------- | ----------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------- |
| 00:00–00:08    | Hook              | Notebook opens; a stable handwritten memory sketch is visible                    | Slow dolly-in over notebook; cyan neural lines remain subtle in the paper texture                   | “क्या आपने… वही रहती है? Memory कोई CCTV recording नहीं है।” | Memory ≠ CCTV recording                |
| 00:08–00:19    | Explain           | The page receives a soft translucent blue update tab after a cue glow            | The tab exists at frame start edge and slides gently onto the page; amber glow expands then settles | “कुछ conditions… sensitive हो सकती है।”                      | कुछ conditions में influence संभव      |
| 00:19–00:31    | Develop           | Notebook page stabilizes; a small secondary note appears beside it               | Slow overhead arc; the first page remains throughout and no content disappears                      | “फिर… influence कर सकती है।”                                 | नई information कभी-कभी असर डाल सकती है |
| 00:31–00:43    | Boundary          | A balanced scale card appears beside two note cards, neither rejected nor erased | Scene cut to same desk palette; cards remain visible while confidence and accuracy icons separate   | “लेकिन… एक जैसी चीज़ नहीं हैं।”                              | हर याद न मिटती है, न झूठी होती है      |
| 00:43–00:51    | Metaphor          | Annotated notebook shows one update tab while most pages stay unchanged          | Camera pulls back moderately; pages stay physically coherent and no literal brain change occurs     | “Notebook खोलने… ज़रूरी नहीं।”                               | यह सिर्फ़ एक metaphor है               |
| 00:51–01:00.68 | Takeaway          | Clean evidence card with notebook, source markers, and context ring              | Gentle upward tilt; all objects remain present; close on calm neutral research desk                 | “Reliability… निष्कर्ष बनता है।”                             | Source + context + evidence            |

## Audio and captions

The primary narration span is at `/home/ubuntu/webdev-static-assets/reel_0002_memory_reconsolidation_narration_full_v01.wav`. It was generated as Hindi off-screen narration and verified as a technically valid mono PCM WAV at 24 kHz with a measured duration of **60.68 seconds**. Timed captions are stored in `/home/ubuntu/webdev-static-assets/reel_0002_memory_reconsolidation_captions_v01.vtt`.

## Execution gates

1. Confirm the actual primary reference image is available and upright 9:16; generate any necessary visual derivatives from that primary anchor only.
2. Generate or assemble a visual bed that covers at least 60.68 seconds without adding unsupported claims.
3. Render H.264/AAC vertical media with the verified narration and Devanagari-first captions.
4. Run file-integrity, duration, resolution, caption-visibility, and evidence-boundary QC.
5. Upload the video, captions, narration, visual reference, plan, and QC records to Batch_001; verify IDs, MIME types, and parent folder.
6. Only then update the catalog status to `uploaded` and resolve the visuals retry.
