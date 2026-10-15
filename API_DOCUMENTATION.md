# 🐬 Dolphin Marine Tutor AI - Complete API Technical Reference

**Version:** `2.0.0`  
**Base URL (Local):** `http://localhost:8000`  
**Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)  
**ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)  
**OpenAPI Specification:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## 📑 Table of Contents

1. [Architecture & Global Conventions](#1-architecture--global-conventions)
2. [Module 1: Chat & Real-Time AI Stream](#2-module-1-chat--real-time-ai-stream)
3. [Module 2: Authentication & User Access](#3-module-2-authentication--user-access)
4. [Module 3: Company Documents & SMS Manuals](#4-module-3-company-documents--sms-manuals)
5. [Module 4: Sessions & Conversation History](#5-module-4-sessions--conversation-history)
6. [Module 5: Quiz & Assessment](#6-module-5-quiz--assessment)
7. [Module 6: Course Synchronization](#7-module-6-course-synchronization)
8. [Module 7: Human Feedback & DPO Dataset](#8-module-7-human-feedback--dpo-dataset)
9. [Module 8: Course Verification](#9-module-8-course-verification)
10. [Module 9: User Administration](#10-module-9-user-administration)
11. [Module 10: Video Transcription](#11-module-10-video-transcription)
12. [Module 11: Storage, Media & System Health](#12-module-11-storage-media--system-health)
13. [Error Handling & HTTP Status Codes](#13-error-handling--http-status-codes)

---

## 1. Architecture & Global Conventions

### 1.1 Ingress & Middleware Stack
Every request through the FastAPI application traverses the following middleware stack:
1. **Security Headers**: HSTS, X-Content-Type-Options (`nosniff`), X-Frame-Options (`DENY`).
2. **Process Time Header**: Adds `X-Process-Time` duration header in seconds.
3. **GZip Compression**: Automatic compression for responses exceeding 1,000 bytes.
4. **Rate Limiting**: Managed via SlowAPI and Redis key-value stores.
5. **CORS**: Allows cross-origin requests from authenticated frontends with `credentials: include`.

### 1.2 Authentication Headers & Cookies
- **Session Cookie**: `marine_session_id` (UUID format).
- **User Cookie**: `marine_user_id` (User ID or email string).
- **Bearer Token**: `Authorization: Bearer <jwt_access_token>`.

---

## 2. Module 1: Chat & Real-Time AI Stream

Source: `backend/api/chat_router.py`  
Engine: `backend/services/chat_service.py`

### 2.1 `POST /chat/working-stream`
Production endpoint used by the UI for real-time Server-Sent Events (SSE) streaming.

- **Rate Limit**: Managed by `rate_limit_chat`.
- **Request Headers**: `Content-Type: application/json`
- **Request Body (`TestChatMessage`)**:
  ```json
  {
    "content": "give sms template",
    "session_id": "848208a8-569b-4e0b-80ee-ee8624127da5",
    "user_id": "vignesh@gmail.com",
    "role": "Chief Engineer",
    "ship": "Sirius Pride",
    "ship_type": "Oil Tanker",
    "company": "Sirius Shipping",
    "skip_clarification": false
  }
  ```
- **Response Format**: `text/event-stream` (Server-Sent Events)
  ```
  data: {"type": "status", "stage": "thinking", "message": "Dolphin is thinking..."}
  
  data: {"type": "content", "token": "### "}
  data: {"type": "content", "token": "Hot "}
  data: {"type": "content", "token": "Work "}
  data: {"type": "content", "token": "Permit\n"}
  
  data: {"type": "media", "images": [{"title": "Hot Work Isolation", "url": "/dolphin/images/hw_01.jpg"}], "videos": []}
  
  data: {"type": "suggestions", "data": ["Enclosed Space Entry Permit", "Bunkering Safety Checklist"]}
  
  data: {"type": "done"}
  ```

### 2.2 `POST /chat`
Synchronous endpoint returning a consolidated `NodeResponse` JSON payload.

- **Request Body (`ChatMessage`)**:
  ```json
  {
    "content": "Explain Main Engine Scavenge Fire actions",
    "session_id": "848208a8-569b-4e0b-80ee-ee8624127da5",
    "user_id": "user_001",
    "category": "QUERY",
    "skip_clarification": false
  }
  ```
- **Response (`NodeResponse`)**:
  ```json
  {
    "type": "query",
    "content": "### Immediate Actions for Scavenge Fire\n1. Reduce engine speed...",
    "sections": [
      {
        "topic_code": "DGS-ENG-04",
        "topic_name": "Scavenge Fires and Crankcase Explosions",
        "content": "..."
      }
    ],
    "chunks_used": [142, 143],
    "videos": [],
    "images": [
      {
        "title": "Scavenge Relief Valve",
        "url": "/dolphin/images/scavenge_relief.jpg"
      }
    ],
    "question_suggestions": [
      "What causes high scavenge temperatures?",
      "How often should scavenge spaces be cleaned?"
    ],
    "metadata": {
      "category": "QUERY",
      "latencies": { "total": 1.18 }
    }
  }
  ```

### 2.3 `POST /chat/switch-session`
Switches active session in Redis for the user.

- **Query Parameters**: `session_id=str`
- **Response**: `{"message": "Session switched"}`

---

## 3. Module 2: Authentication & User Access

Source: `backend/api/login_router.py`  
Source: `backend/api/logout_router.py`  
Source: `backend/api/forgot_password.py`

| Method | Path | Request Body | Description |
|---|---|---|---|
| `POST` | `/login` | `LoginRequest` | Primary login; validates remote CMS token, creates/updates user in DB, caches Redis profile |
| `POST` | `/login/login1` | `LoginRequest` | Route alias for legacy client integration |
| `POST` | `/login/test-login` | `LoginRequest` | Sandbox login bypassing remote LMS API |
| `POST` | `/login/create` | `UserCreate` | Direct user registration |
| `GET` | `/login/usercourses/{user_id}` | None | Retrieves user's registered course codes from LMS API |
| `POST` | `/login/usercourses/{user_id}` | None | Triggers sync of registered user courses |
| `GET` | `/login/debug-db` | None | Lists PostgreSQL columns in table `public.users` |
| `POST` | `/logout` | None | Clears `marine_user_id` and `marine_session_id` cookies |
| `POST` | `/forgot-password` | `{"email": "..."}` | Password recovery request |

---

## 4. Module 3: Company Documents & SMS Manuals

Source: `backend/api/company_router.py`

### 4.1 `POST /companies/upload`
Uploads Shipboard Safety Management System (SMS) manuals, permit formats, or checklists.

- **Content-Type**: `multipart/form-data`
- **Form Parameters**:
  - `company_id` (str, required): Unique company identifier (e.g. `824866`).
  - `files` (list of UploadFile, required): `.docx` or `.pdf` files.
- **Workflow**:
  1. Extracts text from paragraphs, tables, and form control fields via `extract_document_text`.
  2. Inserts row into `public.company_documents` table.
  3. Computes chunk embeddings and adds vectors into `company_index.bin` FAISS index.
- **Response (`CompanyDocumentUploadResponse`)**:
  ```json
  {
    "company_id": "824866",
    "documents": [
      {
        "document_id": "31",
        "document_title": "Hot Work Permit SS 001.docx"
      }
    ]
  }
  ```

---

## 5. Module 4: Sessions & Conversation History

Source: `backend/api/session_router.py`  
Service: `backend/services/session_service.py`

### Endpoints Overview

| Method | Path | Summary | Description |
|---|---|---|---|
| `GET` | `/sessions` | List Sessions | Returns sessions for current user from PostgreSQL |
| `POST` | `/sessions` | Create Session | Creates new conversation session in DB and Redis |
| `GET` | `/sessions/{session_id}` | Get Session Details | Returns complete message history for session |
| `DELETE` | `/sessions/{session_id}` | Delete Session | Deletes session and clears Redis cache |
| `POST` | `/sessions/save/{session_id}` | Bookmark Session | Toggles `is_saved` flag for user |
| `GET` | `/sessions/saved/{user_id}` | Get Bookmarks | Lists saved sessions for user |
| `POST` | `/sessions/message-feedback` | Message Rating | Stores thumbs up/down rating on turn |
| `GET` | `/sessions/topic/{topic_code}` | Topic Lookup | Returns topic curriculum details from DB |
| `GET` | `/sessions/get_all/sessions/` | All Sessions (Admin) | Admin view of all user sessions with email |
| `GET` | `/sessions/` | Paginated Sessions | Filtered admin pagination (`limit`, `offset`, `search`, `all_users`) |

### Key Response Model: `PaginatedSessionResponse`
```json
{
  "total": 142,
  "limit": 10,
  "offset": 0,
  "data": [
    {
      "id": "user_001",
      "username": "vignesh",
      "email": "vignesh@gmail.com",
      "chat_title": "What are all the jobs for OOW in anchorage?",
      "time": "2026-10-14T08:30:00Z",
      "session_id": "d18dd289-7e37-45c9-a8c1-17bbfb53a8b2",
      "chat_count": 6
    }
  ]
}
```

---

## 6. Module 5: Quiz & Assessment

Source: `backend/api/quiz_router.py`

| Method | Path | Description |
|---|---|---|
| `POST` | `/quiz/generate` | Generates 5 multiple-choice questions on specified topic with distractor choices |
| `POST` | `/quiz/submit` | Accepts user answer selections and computes total score |
| `POST` | `/quiz/grade` | Returns detailed explanations, correct answers, and learning advice |

---

## 7. Module 6: Course Synchronization

Source: `backend/course_sync/course_sync_router.py`

| Method | Path | Description |
|---|---|---|
| `POST` | `/sync/courses` | Syncs active courses and topics from central MarinerSkills LMS API |
| `POST` | `/sync/masterData` | Syncs curriculum competencies and course master catalog |
| `POST` | `/sync/masterContent` | Downloads updated topic texts, videos, and figures |
| `POST` | `/sync/sync-course-content-excel` | Ingests spreadsheet `.xlsx` file to populate course lessons |
| `POST` | `/sync/retry` | Re-executes failed synchronization tasks |
| `POST` | `/sync/delete` | Purges deleted courses from tutor database |

---

## 8. Module 7: Human Feedback & DPO Dataset

Source: `backend/api/feedback_router.py`

Total of **21 endpoints** dedicated to RLHF (Reinforcement Learning from Human Feedback), auditing, and model alignment:

| Method | Path | Description |
|---|---|---|
| `POST` | `/feedback` | User submits thumbs up/down, tag reasons, and correction text |
| `GET` | `/feedback/pending` | Moderator queue of unverified responses |
| `GET` | `/feedback/approved` | High-confidence response memory for few-shot injection |
| `GET` | `/feedback/dashboard` | Aggregated analytics (total ratings, acceptance rate, top topics) |
| `GET` | `/feedback/counts` | Feedback counts by category |
| `GET` | `/feedback/stats` | Performance statistics on answer quality |
| `GET` | `/feedback/{id}` | Detailed inspection of single feedback record |
| `POST` | `/feedback/{id}/approve` | Approves bot response |
| `POST` | `/feedback/{id}/reject` | Rejects response (hallucination, factual error) |
| `PUT` | `/feedback/{id}/approved` | Subject Matter Expert (SME) edits the ground-truth response |
| `DELETE` | `/feedback/{id}/approved` | Removes item from approved memory |
| `POST` | `/feedback/{id}/regenerate` | Triggers LLM re-generation with stricter temperature |
| `PATCH` | `/feedback/{id}/review` | Updates reviewer notes |
| `DELETE` | `/feedback/{id}` | Deletes feedback entry |
| `DELETE` | `/feedback/session/{sess}/message/{msg}` | Purges feedback for specific turn |
| `GET` | `/feedback/topics/search` | Topic search autocomplete |
| `GET` | `/feedback/dpo/dataset` | Exports JSONL dataset (`prompt`, `chosen`, `rejected`) |
| `POST` | `/feedback/dpo/jobs` | Dispatches background DPO export job |
| `GET` | `/feedback/dpo/jobs` | Lists export job progress |

---

## 9. Module 8: Course Verification

Source: `backend/api/course_router.py`

### 9.1 `POST /course/check-topic-course`
- **Request Body**: `{"topic_code": "DGS-ENG-01", "user_id": "vignesh"}`
- **Purpose**: Verifies that the requested maritime lesson is included in the company or student's active license.

---

## 10. Module 9: User Administration

Source: `backend/api/user_router.py`

| Method | Path | Security | Description |
|---|---|---|---|
| `GET` | `/users` | `require_super_admin` | Lists all users with assigned role, company ID, and vessel |
| `PUT` | `/users/{user_id}/role` | `require_super_admin` | Updates user authorization role (`STUDENT`, `INSTRUCTOR`, `ADMIN`, `SUPER_ADMIN`) |

---

## 11. Module 10: Video Transcription

Source: `backend/api/video_transcribe_router.py`

### 11.1 `POST /transcribe/video`
- **Parameters**: `video_url`, `language`, `chunk_size_sec`.
- **Behavior**: Downloads or streams maritime training video audio, generates timestamped transcript segments, and writes vectors to `transcribe_index.bin` for instant video retrieval in chat.

---

## 12. Module 11: Storage, Media & System Health

Source: `backend/main.py`

| Method | Path | Response Type | Description |
|---|---|---|---|
| `GET` | `/api/v1/health` | `JSON` | Database pool, Redis ping, FAISS ready state |
| `GET` | `/api/v1/faiss/status` | `JSON` | Total vectors, memory usage, last rebuild timestamp |
| `GET` | `/storage/{filepath}` | `FileResponse` | Serves machinery diagrams, videos, and PDFs from storage directory |
| `GET` | `/dolphin/images/{filepath}` | `FileResponse` | CDN alias for lesson figures and equipment photos |
| `GET` | `/pdf_images/{filepath}` | `FileResponse` | Serves images extracted from course PDFs |
| `GET` | `/dolphin/pdf_thumbnail` | `FileResponse` | Returns thumbnail image for course PDF covers |

---

## 13. Error Handling & HTTP Status Codes

| Status Code | Reason | Example Response |
|---|---|---|
| **`200 OK`** | Standard successful response | `{"status": "success", ...}` |
| **`400 Bad Request`** | Validation failure or missing input | `{"detail": "Message required"}` |
| **`401 Unauthorized`** | Missing or expired token / cookie | `{"detail": "Authentication credentials were not provided"}` |
| **`403 Forbidden`** | User lacks required role permission | `{"detail": "Admin privileges required"}` |
| **`404 Not Found`** | Requested resource doesn't exist | `{"detail": "Session sess_123 not found"}` |
| **`429 Rate Limit`** | Exceeded request limit per minute | `{"error": "Rate limit exceeded: 60 per minute"}` |
| **`500 Server Error`** | Uncaught exception logged to Loguru | `{"detail": "Internal server error"}` |
