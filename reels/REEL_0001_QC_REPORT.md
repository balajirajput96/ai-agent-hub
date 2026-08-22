# Reel 0001 Quality-Control Report

**Canonical catalog record:** `reel_catalog.id = 1`  
**Canonical delivery:** `REEL_0001_HABIT_CUE.mp4`  
**Drive batch:** `Batch_001` (`1585_x-GJem9bYkk31DkGGBwnAI_TXCep`)  
**Status:** **Uploaded and verified**

| Gate                  | Evidence                                                                                                                                                                                                                       | Result            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- |
| Research integrity    | Research record cites peer-reviewed and university sources; it rejects a universal 21-day or 66-day deadline.                                                                                                                  | Pass              |
| Claim boundary        | Scientific evidence, expert explanation, and non-claims are separated in the delivery metadata. No medical or therapeutic promise is made.                                                                                     | Pass              |
| Narration             | Five Hindi narration spans are present; concatenated master duration is 42.16 seconds.                                                                                                                                         | Pass              |
| Captions              | Hindi SRT follows the narration spans and includes an evidence-safe closing card.                                                                                                                                              | Pass              |
| Render integrity      | `ffprobe` verified H.264 video, AAC audio, 720×1280 portrait frame, and exactly 60.0 seconds.                                                                                                                                  | Pass              |
| Drive delivery        | Video, research, captions, delivery metadata, narration master, ambient bed, reference image, and canonical-decision record were listed in `Batch_001` after upload.                                                           | Pass              |
| Native-video capacity | One native 8-second opening clip is used. Further generation hit the free-plan daily video limit. The balance of the render uses the generated reference visual with motion treatment, captions, narration, and ambient audio. | Recorded boundary |

The concurrent `Reel_0001_Habit_Automaticity` folder remains an **alternate draft**. It has not been deleted, modified, or counted as a second completed reel.
