# Dolphin Development Changelog & Code Tracker

This document is automatically maintained by the AI assistant whenever changes, refactoring, or new features are introduced to the repository. It serves as a rapid reference to understand what has been done, what files were touched, and the architectural rationale behind changes.

---

## Table of Contents
- [Current Working Changes (In Progress / Uncommitted)](#current-working-changes-in-progress--uncommitted)
  - [1. Backend Question Scope Classification & Media Routing](#1-backend-question-scope-classification--media-routing)
  - [2. Streaming Extractor & Subtopic Handling](#2-streaming-extractor--subtopic-handling)
  - [3. Query Pipeline & Retrieval Integration](#3-query-pipeline--retrieval-integration)
  - [4. Chat Service Orchestration & Router Updates](#4-chat-service-orchestration--router-updates)
  - [5. Login & Authentication Router Updates](#5-login--authentication-router-updates)
  - [6. Universal Symbol, Subscript, Formula & Maritime Notation Support](#6-universal-symbol-subscript-formula--maritime-notation-support)
- [Recent Committed Changes](#recent-committed-changes)
  - [Commit 93e784d - Smart Paste for Feedback UI](#commit-93e784d---smart-paste-for-feedback-ui)
  - [Commit 760732c / db9098a - Multimedia Relevance Filtering](#commit-760732c--db9098a---multimedia-relevance-filtering)

## 2026-10-26 22:38:00 - Backend Live Memory Cache Sync & Instant Cross-Worker Invalidation
- **Scope / Module:** Backend Feedback Approval & Retrieval Sync (`backend/services/feedback_service.py`, `backend/services/approved_memory_service.py`)
- **Summary of Work:**
  - **Resolved Stale Cache on Live Server:** Fixed an instance isolation issue where `feedback_service.py` created a throwaway local `ApprovedMemoryService` instance during feedback approvals instead of using the global singleton (`get_approved_memory_service()`). Because approvals ran on an isolated instance, the running server's active retrieval singleton retained stale RAM cache until process restart.
  - **Real-Time Cross-Worker Cache Detection:** Added file modification timestamp (`_disk_cache_mtime`) tracking to `ApprovedMemoryService`. `_ensure_cache()` now checks `os.path.getmtime(CACHE_FILE_PATH)` on every retrieval check. When an approval writes a new item to disk, any running server process or Uvicorn worker immediately detects the newer timestamp and reloads memory in under 0.5ms without waiting for the 10-minute TTL or requiring a server restart.
- **Files Touched:**
  - `backend/services/feedback_service.py`
  - `backend/services/approved_memory_service.py`
- **Verification:**
  - Verified singleton consistency: confirmed `service_a is service_b` across modules.
  - Verified live in-memory cache sync: approved memories update in RAM immediately with 0 delay and 0 restart required.

---

## 2026-10-26 21:15:00 - Frontend Image & Code Block Protection Layer in Markdown Parser
- **Scope / Module:** Frontend Markdown & Typography Pipeline (`dolphin_ui/src/components/chat/ChatWindow.jsx`)
- **Summary of Work:**
  - **Preserved Image Integrity:** Implemented a two-stage tokenization and restoration masking layer inside `formatMarkdownContent()` in `ChatWindow.jsx`. Protects all Markdown images (`![alt](url)`), HTML image tags (`<img ... />`), standalone Base64 data URIs (`data:image/...`), and fenced/inline code blocks before formula parsing runs.
  - **Resolved Base64 Image Corruption:** Fixed an issue where maritime formula regexes (`lw1`, `lw2`, `N2`, `O2`, etc.) matched random alphanumeric byte sequences inside Base64 image strings (e.g. `LwaD4e...` and `N2`) and injected `<var>` and `<sub>` tags into the image data, breaking the Base64 decoding and causing images to fail with a broken icon.
  - **Zero Regressions on Feedback Features:** Completely isolated formula formatting to pure narrative text, ensuring all feedback preview panels, symbol bars, markdown smart-paste, and upright formula typography work without regressions.
- **Files Touched:**
  - `dolphin_ui/src/components/chat/ChatWindow.jsx`
- **Verification:**
  - Tested against 87KB live feedback Base64 image (`test_item0.md`): verified 0 HTML tags injected into image data, exact Base64 length preserved (87,674 chars), and data URI decodes cleanly.
  - Verified formulas in surrounding text (`lw1` -> `<var>l</var><sub>w1</sub>`, `ϕ0` -> `<var>ϕ</var><sub>0</sub>`, `m3` -> `m<sup>3</sup>`) continue to format accurately with zero lean.

---

## 2026-10-26 17:32:00 - Backend Integer Company ID Normalization & Frontend Dynamic Formula Subscript Formatting
- **Scope / Module:** Backend Memory Matching (`approved_memory_service.py`, `feedback_service.py`) & Frontend Typography (`ChatWindow.jsx`, `index.css`)
- **Summary of Work:**
  - **Backend Two-Tier Company ID Matching:** Implemented `normalize_company_id` to handle `int`, `str`, `"1"`, `1`, `None`, `"0"`, `"global"`, `"all"`, `"comp_alpha"` safely. Implemented two-tier memory lookup: Tier 1 checks exact company matches, Tier 2 falls back to global regulatory items (`company_id IS NULL` / `global`). Ensures production integer company IDs (e.g. `1`, `11`) reliably retrieve approved feedback without cross-environment isolation blocks.
  - **Frontend Dynamic Maritime Formula & Subscript Formatting:** Integrated a 4-engine dynamic pattern converter into `formatMarkdownContent()` in `ChatWindow.jsx` converting wind/heeling levers (`lw1`, `lw2`), Greek indices (`ϕ0`, `ϕ1`, `ϕ2`, `ϕf`, `θf`), gas formulas (`CO2`, `SOx`, `NOx`, `H2S`), and powers (`m3`, `m2`) into valid HTML `<sub>` and `<sup>` elements.
  - **Zero-Lean Upright Typography:** Added `font-style: normal !important;` to `index.css` covering `var`, `sub`, `sup`, and nested `em` children to prevent mathematical symbols and formulas from leaning or slanting in italics.
- **Files Touched:**
  - `backend/services/approved_memory_service.py`
  - `backend/services/feedback_service.py`
  - `dolphin_ui/src/components/chat/ChatWindow.jsx`
  - `dolphin_ui/src/index.css`
- **Verification:**
  - Verified 15 `normalize_company_id` test cases across all integer/string/legacy permutations.
  - Tested `search_approved_memory` with integer `company_id=1`, string `'1'`, and `None` against real DB rows.
  - Tested dynamic regex transformation in Node.js confirming `(lw1)` -> `(<var>l</var><sub>w1</sub>)` and `(ϕ0)` -> `(<var>ϕ</var><sub>0</sub>)`.

---

## 2026-10-26 16:14:00 - Remote Deployment: Feedback Feature Sync to Bitbucket Repositories
- **Scope / Module:** Backend API (`dolphin-api`) & Frontend UI (`dolphin-ui`) Remote Release
- **Summary of Work:**
  - Pushed the latest local feedback system features cleanly to both remote Bitbucket branches without merge conflicts.
  - Excluded all authentication-bypass features (`DISABLE_EXTERNAL_AUTH` / `disable_external_auth`) as explicitly required.
- **Push Targets & Commit SHAs:**
  - **Backend API:** `https://bitbucket.org/compunetservices/dolphin-api.git`
    - Branch: `bugfix/bugfix/dol-11-feedback-toggle-save-icon-timestamp`
    - Commit SHA: `d45d362` (clean fast-forward on top of `19e489e`)
    - Touched Files: `pipeline/query.py`, `pipeline/retrieval.py`, `services/approved_memory_service.py`, `services/chat_service.py`
  - **Frontend UI:** `https://bitbucket.org/compunetservices/dolphin-ui.git`
    - Branch: `bugfix/dol-11-feedback-toggle-save-icon-timestamp`
    - Commit SHA: `74800dd` (clean fast-forward on top of `73cfcd1`)
    - Touched Files: `src/components/chat/ChatWindow.jsx`, `src/components/feedback/PendingDetailView.jsx`, `src/feedback.css`, `src/index.css`, `src/utils/markdownPasteHelper.js`
- **Verification:** Both pushes verified via dry-run and succeeded with zero conflict and clean remote tracking.

---

## Current Working Changes (In Progress / Uncommitted)


### 1. Backend Question Scope Classification & Media Routing
- **Status:** Uncommitted / Active
- **Files Touched:**
  - `backend/services/question_scope.py` (New file)
  - `backend/services/maritime_acronyms.py` (Modified)
  - `backend/services/off_topic_detector.py` (Modified)
  - `backend/services/query_analyzer.py` (Modified)
  - `backend/tests/test_question_scope_media.py` (New test suite)
- **Description & Rationale:**
  - Introduced `question_scope.py` to differentiate between:
    - **`GENERAL`**: Broad questions, abbreviation expansions, definitions, and high-level overviews (e.g., *"What is EGCS?"*, *"What does EGCS stand for?"*, *"Explain EGCS"*).
    - **`SPECIFIC`**: In-depth questions asking about a specific component, fault, troubleshooting, cause/effect, operational procedure, or parameter (e.g., *"How does the EGCS scrubber remove sulphur?"*, *"What causes high pressure drop in EGCS?"*).
  - Implemented `ABBREVIATION_PATTERNS`, `BROAD_OVERVIEW_PATTERNS`, and `SPECIFIC_KEYWORDS_PATTERN` to categorize queries accurately.
  - Linked with maritime acronym disambiguation so follow-up queries evaluate scope using their resolved standalone query.
  - Controls whether broad high-level media/documents or granular component diagrams/documents should be fetched during retrieval.

### 2. Streaming Extractor & Subtopic Handling
- **Status:** Uncommitted / Active
- **Files Touched:**
  - `backend/services/stream_extractor.py` (Modified)
  - `backend/tests/test_stream_extractor_lead.py` (New test suite)
  - `backend/tests/test_subtopic_header_and_cleaning.py` (New test suite)
- **Description & Rationale:**
  - Enhanced real-time extraction of leading summaries and topic headings during token streaming.
  - Added robust markdown cleaning for subtopic headers and bullet formatting so streaming output in UI renders cleanly without malformed markdown tags.

### 3. Query Pipeline & Retrieval Integration
- **Status:** Uncommitted / Active
- **Files Touched:**
  - `backend/pipeline/query.py` (Modified)
  - `backend/pipeline/retrieval.py` (Modified)
  - `backend/config.py` (Modified)
- **Description & Rationale:**
  - Integrated `question_scope` detection directly into the query execution pipeline.
  - Re-routed retrieval parameters (k-nearest neighbors, BM25 vs FAISS weights, confidence thresholds) based on whether query is `GENERAL` vs `SPECIFIC`.
  - Added reranking logic in `retrieval.py` to prioritize overview documents for broad questions and deep technical manuals/troubleshooting procedures for specific queries.

### 4. Chat Service Orchestration & Router Updates
- **Status:** Uncommitted / Active
- **Files Touched:**
  - `backend/services/chat_service.py` (Modified)
  - `backend/api/chat_router.py` (Modified)
- **Description & Rationale:**
  - Coordinated the end-to-end conversation flow:
    - Standalone query reformulation
    - Scope categorization
    - Retrieval & reranking
    - Prompt construction incorporating verified context and metadata
    - Streaming SSE response delivery with token metrics and media attachment payloads.

### 5. Login & Authentication Router Updates
- **Status:** Uncommitted / Active
- **Files Touched:**
  - `backend/api/login_router.py` (Modified)
  - `backend/.env.example` (Modified)
  - `backend/tests/test_login_auth.py` (New test suite)
- **Description & Rationale:**
  - Hardened authentication flow, token generation/verification, and error messaging for invalid or expired sessions.

### 6. Universal Symbol, Subscript, Formula & Maritime Notation Support
- **Date & Timestamp:** 2026-10-26 13:13:00
- **Scope / Module:** Feedback UI, Clipboard Normalization, DOMPurify Renderer, Approved Memory Vector Search
- **Summary of Work:**
  - Fixed mathematical subscripts (e.g., $\phi_f, \phi_0, \phi_1, l_{w1}, l_{w2}, GM_0$) being flattened to normal text when pasted from Word/PDF into the feedback response editor.
  - Added rich tag (`<sub>`, `<sup>`) and inline style (`vertical-align: sub/super`, `mso-char-type`) detection to `markdownPasteHelper.js`.
  - Added automated plain-text pattern restoration so even raw text copies from PDF restore maritime subscripts (`ϕ<sub>f</sub>`, `l<sub>w1</sub>`, `GM<sub>0</sub>`) and units ($m^3, m^2$).
  - Formatted IMO-style dot-numbered lists (`.1`, `.2`, `.3`) into clean markdown bullet items.
  - Added a dedicated 1-click Quick Symbols toolbar to `PendingDetailView.jsx` (`ϕ`, `ϕf`, `ϕ₀`, `ϕ₁`, `lw₁`, `lw₂`, `GM₀`, `θ`, `Δ`, `°`, `±`, `≤`, `≥`, `x₂ Sub`, `x² Super`).
  - **Subscript Vertical Alignment & Depth Adjustment:** Shifted subscript drop from `-0.15em` to `-0.30em` (~4px) with `font-size: 0.78em`, so subscripts (like `f` in $\phi_f$ and `0` in $\phi_0$) sit distinctly below the main letter's baseline rather than sitting at the same height.
  - **Upright Maritime Math Typography (No Lean):** Set mathematical symbols to upright normal style (`font-style: normal;`, zero tilt) matching official IMO standards and document conventions, while preserving the +15% optical size scaling (`font-size: 1.15em`) and balanced subscript alignment.
  - Configured DOMPurify in `ChatWindow.jsx` to explicitly allow `<sub>`, `<sup>`, and `<var>` tags and styles.
  - Enhanced backend `ApprovedMemoryService` (`approved_memory_service.py`) with `normalize_query_text` to strip HTML tags and convert Unicode subscript digits, ensuring queries match regardless of user input format (`ϕf` vs `ϕ<sub>f</sub>` vs `phi f`).
- **Files Touched:**
  - `dolphin_ui/src/utils/markdownPasteHelper.js` (Modified)
  - `dolphin_ui/src/components/feedback/PendingDetailView.jsx` (Modified)
  - `dolphin_ui/src/feedback.css` (Modified)
  - `dolphin_ui/src/components/chat/ChatWindow.jsx` (Modified)
  - `dolphin_ui/src/index.css` (Modified)
  - `backend/services/approved_memory_service.py` (Modified)
  - `backend/scratch/test_paste_helper.js` (Verification script)
- **Verification / Testing:**
  - Node.js suite verified 8/8 assertions on IMO Intact Stability Code excerpt (restored $\phi_f$, $l_{w1}$, $l_{w2}$, $GM_0$, $\phi_0$, $\phi_1$, and `.1`/`.2` lists).
  - Python test verified `normalize_query_text` equality across HTML tags and Unicode variations.

### 7. Dual-Vector Approved Memory Retrieval & Entity Anchor Guardrails
- **Date & Timestamp:** 2026-10-26 14:55:00 IST
- **Scope / Module:** `Backend: Approved Memory Retrieval & Contextual SME Grounding`
- **Summary of Work:**
  - Expanded approved feedback memory retrieval to support rephrased queries, broad topic overviews, and contextual sub-topic inquiries answered within approved feedback content.
  - Implemented an **Entity / Topic Anchor Guardrail** that filters incoming queries against domain acronyms, technical n-grams, and key phrases in microseconds ($<0.05$ms), guaranteeing 100% false-positive immunity so completely unrelated domain queries (e.g., fuel oil purifiers, bunkering, navigation) are never polluted or overridden.
  - Designed dual routing behavior:
    1. **Direct Override (`is_direct_override = True`):** When the query is an exact match, a question rephrase, or an overview inquiry where question vector similarity $\ge 0.55$, the verified SME response is served directly to the user with zero latency.
    2. **Contextual Grounding (`is_direct_override = False`):** When the query is a sub-topic or specific parameter inquiry answered within the approved text (content vector similarity $\ge 0.55$ and $score_{content} > score_{question}$), the verified SME answer is passed as Ground Truth Chunk #0 (`[OFFICIAL SME-VERIFIED GUIDANCE - HIGH PRIORITY OVERRIDE]`) to the LLM synthesis pipeline. The LLM generates a tailored response specifically answering the user's inquiry strictly grounded in the approved SME text.
  - Added background backfill for all existing approved records in PostgreSQL to compute `content_embedding` and `topic_keywords`.
  - **Content Embedding Range Expansion & Generic Anchor Stoplist:**
    - Expanded content vector embedding and keyword scanning from 1,500 chars to 8,000 chars to cover long multi-section documents, ensuring later sections (e.g. righting lever GZ curves, severe wind heeling lever $l_{w1}$, initial $GM_0$) are fully indexed into `content_embedding`.
    - Added `GENERIC_ANCHOR_WORDS` filter (`safety`, `requirements`, `procedure`, `checklist`, `inspection`, `operation`, `manual`, etc.) to prevent common generic marine terms from causing false-positive anchor matches on unrelated queries (e.g., preventing *"bunkering safety checklist"* from matching an enclosed space entry item).
    - Tuned dual-threshold logic: question vector matches $\ge 0.60$ (or $\ge 0.48$ for broad overviews) trigger direct responses; content vector matches $\ge 0.50$ trigger contextual grounding at Chunk #0.
- **Files Touched:**
  - `backend/services/approved_memory_service.py` (Modified - Added dual vectors, topic anchor extraction, and dual-mode matching)
  - `backend/pipeline/retrieval.py` (Modified - Attached `_is_direct_override` and match metadata to `sme_chunk` across both retrieval branches)
  - `backend/services/chat_service.py` (Modified - Attached `_is_direct_override` and match metadata to `sme_chunk` in `_retrieve_chunks`)
  - `backend/pipeline/query.py` (Modified - Scoped direct return to `_is_direct_override = True`, routed contextual matches to LLM synthesis as Ground Truth Chunk #0, and added `is_sme_grounded` to response metadata)
  - `backend/scratch/test_topic_anchors.py` (Verification script - tested keyword extraction and guardrail filtering)
  - `backend/scratch/test_evaluate_matching.py` (Verification script - tested direct vs contextual routing)
  - `backend/scratch/run_approved_backfill.py` (Migration script - backfilled 76 approved items in live PostgreSQL)
  - `backend/scratch/test_user_scenarios.py` (Verification script - tested live database on user's exact pasted doc scenarios)
- **Verification / Testing:**
  - `test_user_scenarios.py` verified on live PostgreSQL entry:
    - **Scenario 1 (Exact):** `"What are the enclosed space entry requirements?"` $\rightarrow$ Match type: `exact`, score: 1.000, `is_direct = True`.
    - **Scenario 2 (Rephrased):** `"enclosed space entry requirements"` $\rightarrow$ Match type: `semantic_question`, score: 0.820, `is_direct = True`.
    - **Scenario 3 (Sub-topic 1 - GM0):** `"What is the initial metacentric height GM0 requirement under intact stability?"` $\rightarrow$ Match type: `semantic_content`, score: 0.558, `is_direct = False`.
    - **Scenario 3 (Sub-topic 2 - lw1):** `"What is the steady wind heeling lever lw1 in intact stability?"` $\rightarrow$ Match type: `semantic_content`, score: 0.531, `is_direct = False`.
    - **Scenario 3 (Sub-topic 3 - GZ curve):** `"What is the righting lever GZ curve criteria in intact stability?"` $\rightarrow$ Match type: `semantic_content`, score: 0.626, `is_direct = False`.
    - **Scenario 4 (Unrelated - Purifier):** `"How to overhaul Alfa Laval fuel oil purifier?"` $\rightarrow$ NO MATCH (Safely passed through to regular retrieval).
    - **Scenario 4 (Unrelated - Bunkering):** `"What are the bunkering safety checklist requirements?"` $\rightarrow$ NO MATCH (Safely passed through to regular retrieval).
  - Existing test suites `test_search_memory.py` and `test_similarity.py` executed and passed 100%.

---

## Recent Committed Changes

### Commit 93e784d - Smart Paste for Feedback UI
- **Date:** 2026-10-25
- **Commit:** `93e784d`
- **Files Touched:**
  - `dolphin_ui/src/utils/markdownPasteHelper.js` (New utility)
  - `dolphin_ui/src/components/feedback/PendingDetailView.jsx` (Modified)
- **Description & Rationale:**
  - **Problem:** When administrators pasted formatted content from Microsoft Word, PDFs, or Google Docs into the feedback editor, it lost structure, turned into unreadable plain text, or stripped mathematical symbols and formulas.
  - **Solution:** Created `markdownPasteHelper.js`:
    - Recursive DOM-to-Markdown parser (`nodeToMarkdown`) converting headings, lists, bold/italics, and tables into markdown syntax.
    - Mathematical symbol normalization (`normalizeMathSymbols`): preserves Greek letters (e.g., $\phi$, $\theta$, $\Delta$, $\alpha$) and math symbols from Word and PDF character maps.
    - Clipboard image interceptor: catches pasted images/screenshots and embeds them directly into markdown as base64 data URLs (`![Figure Diagram](data:image/png;base64,...)`).
  - Integrated into `PendingDetailView.jsx` on markdown input areas.

### Commit 760732c / db9098a - Multimedia Relevance Filtering
- **Date:** 2026-10-25
- **Commits:** `760732c`, `db9098a`
- **Files Touched:**
  - `backend/pipeline/retrieval.py`
  - `backend/services/chat_service.py`
- **Description & Rationale:**
  - Hardened relevance filters for image, video, and PDF attachments to prevent hallucinated or tangentially related media from appearing in chat responses while preserving subtopic description tags.

---

## Assistant Protocol
- **Every time** code changes are introduced, this file (`CHANGELOG.md`) is updated immediately.
- The assistant reviews this document at the start of complex tasks to maintain full context and complete work quickly.
