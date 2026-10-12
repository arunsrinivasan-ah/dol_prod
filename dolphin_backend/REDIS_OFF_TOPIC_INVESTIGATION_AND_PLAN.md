# Dolphin AI: Production vs. Local "Off-Topic" & Redis Contamination Analysis

**Document Status:** Complete Architecture Investigation & Resolution Plan  
**Target Systems:** `dolphin_backend` (`chat_service.py`, `dynamic_acronym_service.py`, `chat_router.py`, `query_analyzer.py`), `dolphin_ui`  
**Date:** October 12, 2026  

---

## 1. Executive Summary & Problem Statement

### Observed Symptoms:
1. **Specific Words Fail in Production:** Words/terms return accurate answers in the local environment, but in production, they fail immediately and return an **"Off-Topic / Out of Scope"** response.
2. **The "Cascade Effect" Across Users:** When User A asks an off-topic question and receives an off-topic refusal, the next question (even asked by User B or a subsequent turn) also returns an off-topic refusal.
3. **Environment Divergence:** Local environment has **NO Redis**, while Production has **Redis enabled**.

---

## 2. Root Cause Analysis: The 4 Culprits

```
                                SYSTEM INTERACTION MAP
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ USER QUERY                                                                             │
└───────────┬────────────────────────────────────────────────────────────────────────────┘
            │
            ├────────► [DYNAMIC ACRONYM CHECK]
            │          redis: dolphin:dynamic_acronym:{word} == "__NOT_MARITIME__" (7 Days!)
            │          └──► Fails is_tech_term ──► Skips Rescue Guard ──► 🚫 OFF-TOPIC REFUSAL
            │
            ├────────► [ACTIVE SESSION LOOKUP]
            │          redis: active_session:test-user ──► Reuses previous user's session!
            │          └──► Loads session_cache:{session_id} containing User A's off-topic chat
            │
            └────────► [QUERY REWRITER (LLM)]
                       Input: Previous Question ("Who is Elon Musk?") + Current ("Safety rules?")
                       Rewritten: "What are the safety rules of Elon Musk?"
                       └──► Matches off-topic regex ──► 🚫 OFF-TOPIC REFUSAL
```

---

### Culprit 1: Global 7-Day Negative Word Lock in Redis
* **Location:** `dolphin_backend/services/dynamic_acronym_service.py`
* **Mechanism:**
  When a user asks a short term, abbreviation, or single word, `dynamic_acronym_service` asks `gpt-4o-mini` if it is a maritime term. If GPT returns `is_maritime: false`:
  ```python
  await redis_service.redis.setex(
      f"dolphin:dynamic_acronym:{token_clean}",
      7 * 86400,  # 7 DAYS (604,800 seconds)
      "__NOT_MARITIME__"
  )
  ```
* **Why it breaks Production:**
  * This Redis key has **no user ID**—it is completely global.
  * Once a word is marked `"__NOT_MARITIME__"`, it is locked out across the **entire company for 7 days**.
  * In `chat_service.py`, `is_tech_term` evaluates to `False`. The rescue guard in `query_analyzer.py` fails, and the word is rejected as off-topic.
* **Why Local passed:**
  * Local has no Redis. It never permanently caches `"__NOT_MARITIME__"`.

---

### Culprit 2: Query Rewriter Context Poisoning
* **Location:** `dolphin_backend/services/chat_service.py` & `dolphin_backend/services/query_analyzer.py`
* **Mechanism:**
  When loading message history:
  ```python
  previous_questions = [msg["content"] for msg in cleaned_messages if msg["role"] == "user"]
  ```
  `chat_service.py` **never filtered out off-topic user messages or off-topic assistant refusals**.
* **The Cascade Flow:**
  1. Turn 1 (User A): *"Who won the cricket match?"* $\rightarrow$ Assistant gives an off-topic refusal.
  2. Turn 2 (User B): *"What are the safety rules?"*
  3. `rewrite_query` merges Turn 2 with Turn 1:
     $$\rightarrow \mathbf{"What\ are\ the\ safety\ rules\ of\ cricket?"}$$
  4. This matches the off-topic regex for sports $\rightarrow$ Triggers another off-topic refusal!
  5. In `query_analyzer.py`:
     ```python
     if q.lower() in {"this", "that", "it"}:
         return f"{q} {previous_questions[-1]}"
     ```
     Short questions like *"explain it"* directly append the off-topic question.
* **Why Local passed:**
  * Local without Redis generated empty history (`previous_questions = []`) for each request, so the rewriter never had past off-topic context to merge.

---

### Culprit 3: Shared Fallback Session Pointer in Redis
* **Location:** `dolphin_backend/api/chat_router.py`
* **Mechanism:**
  ```python
  user_id = payload.user_id or "test-user"  # or "anonymous"
  session_id = await redis_service.get_active_session(user_id)
  ```
  If `payload.session_id` is missing, or if users are unauthenticated/guests, the backend reads `active_session:test-user` from Redis.
* **Why it breaks Production:**
  * User 2 receives the exact session ID of User 1 and loads User 1's conversation history (`session_cache:{session_id}`).
  * All guest users overwrite and share the same Redis session.

---

### Culprit 4: Dynamic Domain Whitelist Failure at Startup
* **Location:** `dolphin_backend/services/dynamic_domain_service.py` and `dolphin_backend/main.py`
* **Mechanism:**
  During startup, Dolphin harvests topic names from PostgreSQL to build an in-memory whitelist. In `off_topic_detector.py`:
  ```python
  if dynamic_domain_service.is_db_domain_match(query):
      return False  # Whitelisted from off-topic
  ```
  If the production container had any delay connecting to PostgreSQL during startup, harvesting was skipped (`⚠️ DB harvesting skipped`), leaving the topic whitelist empty (0 topics).

---

## 3. User ID & Frontend Transmission Audit

| Interface | Is `user_id` sent in request? | Backend Target | Session Isolation Status |
| :--- | :--- | :--- | :--- |
| **React UI (`dolphin_ui`) - Logged In** | **YES** (`localStorage.getItem("user_id")`) | `/chat/working-stream` | Isolated per user ID, but still vulnerable to Culprits 1 & 2. |
| **React UI (`dolphin_ui`) - Guest / Logged Out** | **NO** (`payload.user_id = null`) | `/chat/working-stream` | Collides on `active_session:test-user`. |
| **Static HTML UI (`dolphin_backend/ui`)** | **NO** (Omitted from JSON body in `chat.js:757`) | `/chat` | Collides on `active_session:anonymous`. |

> **Key Takeaway:** Even when `user_id` is sent by a logged-in user, it **does not protect** against Culprit 1 (Global Acronym Cache) or Culprit 2 (Within-Session Context Poisoning).

---

## 4. Latency Impact Profile

| Query Type | Pipeline Route | Rewriter / Intent LLM | Off-Topic LLM | Retrieval / Generation | Total Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Healthy Marine Query** | Fast-Path | **0.00s** (Skipped) | 0.00s | 1.2s – 2.0s | **~1.5s – 2.0s** |
| **Healthy Conversational** | Standard Pipeline | 1.2s – 1.8s | 0.00s | 1.2s – 2.0s | **~2.8s – 3.8s** |
| **Falsely Blocked Query** | Contaminated Path | 1.2s – 2.2s (Wasted) | 0.8s – 1.6s (Wasted) | 0.00s (Skipped) | **~2.0s – 3.8s** (Wrong Answer!) |

---

## 5. The Step-by-Step Resolution Plan

### Step 1: Remove the 7-Day Negative Word Cache
In `dolphin_backend/services/dynamic_acronym_service.py`:
* Keep rejected words in process memory (`self._rejected_set`) only.
* Stop saving `"__NOT_MARITIME__"` in Redis for 7 days.

```diff
--- a/dolphin_backend/services/dynamic_acronym_service.py
+++ b/dolphin_backend/services/dynamic_acronym_service.py
@@ -290,13 +290,6 @@
             # If not maritime, cache negative result
             self._rejected_set.add(token_clean)
-            try:
-                if redis_service.is_connected() and redis_service.redis:
-                    await redis_service.redis.setex(
-                        redis_key,
-                        7 * 86400,
-                        "__NOT_MARITIME__"
-                    )
-            except Exception:
-                pass
             return None
```

---

### Step 2: Sanitize Conversation History for Query Rewriter
In `dolphin_backend/services/chat_service.py` & `dolphin_backend/services/query_analyzer.py`:
* Filter out turns marked as `OFF_TOPIC` or containing off-topic refusals from `previous_questions` and `last_answer`.

```diff
--- a/dolphin_backend/services/chat_service.py
+++ b/dolphin_backend/services/chat_service.py
@@ -2422,10 +2422,17 @@
         cleaned_messages = self._clean_messages(db_messages)
 
-        previous_questions = [
-            msg.get("content", "")
-            for msg in cleaned_messages
-            if isinstance(msg, dict) and msg.get("role") == "user"
-        ]
+        previous_questions = []
+        for msg in cleaned_messages:
+            if isinstance(msg, dict) and msg.get("role") == "user":
+                cat = str(msg.get("category", "")).upper()
+                if cat not in ("OFF_TOPIC", "FALLBACK"):
+                    previous_questions.append(msg.get("content", ""))
```

```diff
--- a/dolphin_backend/services/query_analyzer.py
+++ b/dolphin_backend/services/query_analyzer.py
@@ -304,3 +304,3 @@
         if q.lower() in {"this", "that", "it"}:
-            return f"{q} {previous_questions[-1]}"
+            if previous_questions and not is_off_topic_query(previous_questions[-1]):
+                return f"{q} {previous_questions[-1]}"
+            return q
```

---

### Step 3: Isolate Fallback Sessions in Chat Router
In `dolphin_backend/api/chat_router.py`:
* Never lookup or share `active_session` in Redis if `user_id in ("test-user", "anonymous", "")`.
* Always create a fresh session if `payload.session_id` is missing for guests.

```diff
--- a/dolphin_backend/api/chat_router.py
+++ b/dolphin_backend/api/chat_router.py
@@ -83,12 +83,14 @@
     user_id = payload.user_id or "anonymous"
+    is_guest = user_id in ("anonymous", "test-user", "")
 
     # SESSION
-    session_id = await redis_service.get_active_session(user_id)
+    session_id = payload.session_id
+    if not session_id and not is_guest:
+        session_id = await redis_service.get_active_session(user_id)
 
     if not session_id:
         session = await session_service.create_session(user_id)
         session_id = session["session_id"]
-        await redis_service.set_active_session(user_id, session_id)
+        if not is_guest:
+            await redis_service.set_active_session(user_id, session_id)
```

---

### Step 4: Flush Contaminated Redis Keys in Production
Run these commands in production to clear contaminated cache:

```bash
# Delete shared active session pointers:
redis-cli DEL "active_session:test-user"
redis-cli DEL "active_session:anonymous"

# Delete all cached negative word rejections:
redis-cli --scan --pattern "dolphin:dynamic_acronym:*" | xargs -r redis-cli del
```

---

## 6. Verification Checklist

1. [ ] Send an off-topic query (*"Who is Elon Musk?"*) $\rightarrow$ Dolphin politely declines.
2. [ ] In the very next question (or next session), ask a legitimate maritime question (*"What are boiler safety checks?"*) $\rightarrow$ Dolphin answers immediately without cascade failure.
3. [ ] Ask previously failing terms/acronyms $\rightarrow$ Verified they are no longer blocked by Redis.
4. [ ] Verify terminal latency logger shows `query_rewrite = 0.00s` on direct marine questions.
