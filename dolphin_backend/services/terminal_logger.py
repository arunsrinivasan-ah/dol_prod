# dolphin_backend/services/terminal_logger.py
import datetime
import sys
import textwrap
from typing import Any, Dict, List, Optional


def _safe_print(text: str) -> None:
    """Prints text safely without crashing on Windows cp1252 / terminal encodings."""
    try:
        print(text)
    except (UnicodeEncodeError, UnicodeError):
        encoding = getattr(sys.stdout, "encoding", "utf-8") or "utf-8"
        sanitized = text.encode(encoding, errors="replace").decode(encoding)
        print(sanitized)


# =============================================================================
# 1. CHAT EXECUTION BOXES (POST /chat, POST /chat/working-stream, etc.)
# =============================================================================
def print_chat_execution_boxes(
    user_query: str,
    user_profile: Optional[Dict[str, Any]],
    user_id: Optional[str],
    session_id: Optional[str],
    router_decision: Optional[Dict[str, Any]],
    node_type: str,
    standalone_query: str,
    retrieval_chunks: List[Dict[str, Any]],
    prompt_file: str,
    prompt_template_name: str,
    model_name: str,
    response_content: str,
    videos: List[Dict[str, Any]],
    images: List[Dict[str, Any]],
    latencies: Dict[str, float],
    company_answer: Optional[str] = None,
    api_endpoint: str = "POST /chat",
    prompt_template_text: Optional[str] = None,
    prompt_start_line: int = 18,
    prompt_end_line: int = 170,
) -> None:
    """
    Prints a clean, structured 3-box terminal summary after the chat operation completes.
    - Box 1: Request Field (User details, question asked, dynamic API endpoint)
    - Box 2: Background Operations Pipeline (Step-by-step with code line references)
    - Box 3: Response Field (AI generated answer, documents referenced, media, timings)
    """
    user_profile = user_profile or {}
    router_decision = router_decision or {}
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Extract user profile details
    user_name = user_profile.get("name") or user_profile.get("user_name") or "User"
    resolved_uid = user_id or user_profile.get("id") or "N/A"
    user_role = user_profile.get("role") or "Standard Student"
    ship_name = user_profile.get("ship_name") or user_profile.get("ship_type") or "General Vessel"
    company_name = user_profile.get("company_name") or "Maritime Academy"
    company_id = user_profile.get("company_id") or "N/A"

    border_double = "=" * 92
    border_single = "-" * 92

    # -------------------------------------------------------------------------
    # BOX 1: REQUEST FIELD
    # -------------------------------------------------------------------------
    box1_lines = [
        "",
        border_double,
        "[BOX 1: REQUEST FIELD]",
        border_double,
        f"   User Name    : {user_name}",
        f"   User ID      : {resolved_uid}",
        f"   Session ID   : {session_id or 'N/A'}",
        f"   API Endpoint : {api_endpoint}",
        f"   Timestamp    : {now_str}",
        "",
        "   Asked Question:",
        f"   \"{user_query.strip()}\"",
        border_double,
        "",
    ]
    _safe_print("\n".join(box1_lines))

    # -------------------------------------------------------------------------
    # BOX 2: BACKGROUND OPERATIONS PIPELINE (Step-by-step with clean spaces)
    # -------------------------------------------------------------------------
    intent_category = router_decision.get("category") or node_type.upper()
    intent_reason = router_decision.get("reason") or f"Direct routing to {node_type}"

    # Determine retrieval info
    num_chunks = len(retrieval_chunks)
    doc_lines: List[str] = []
    seen_topics = set()
    for idx, c in enumerate(retrieval_chunks[:6], 1):
        t_name = c.get("topic_name") or c.get("title") or "General Maritime Topic"
        t_code = c.get("topic_code") or "N/A"
        c_id = c.get("content_id") or c.get("id") or "N/A"
        c_code = c.get("course_code") or c.get("course_name") or "Standard Course"
        doc_lines.append(f"         [{idx}] Topic: \"{t_name}\"")
        doc_lines.append(f"             Code: {t_code} | Course: {c_code} | DB Row ID: {c_id}")
        seen_topics.add(t_name)

    if not doc_lines:
        doc_lines.append("         (No course chunks required - direct social/greeting response)")

    box2_lines = [
        border_double,
        "[BOX 2: BACKGROUND OPERATIONS PIPELINE]",
        border_double,
        "",
        "   [STEP 1: USER CONTEXT & PROFILE LOOKUP]",
        "      * Code Reference    : dolphin_backend/api/chat_router.py (lines 120-132)",
        "      * Database Table    : PostgreSQL 'users' & 'user_profiles'",
        f"      * User Role         : {user_role} | Ship: {ship_name}",
        f"      * Company Assigned  : {company_name} (Company ID: {company_id})",
        "",
        f"   {border_single}",
        "",
        "   [STEP 2: INTENT CLASSIFICATION]",
        "      * Code Reference    : dolphin_backend/services/gpt_intent_service.py (lines 25-150)",
        "      * Prompt Template   : INTENT_CLASSIFIER_PROMPT",
        "      * Model & Settings  : gpt-4o-mini | Temperature: 0.0",
        f"      * Detected Intent   : {intent_category} ({intent_reason})",
        "",
        f"   {border_single}",
        "",
        "   [STEP 3: CONVERSATIONAL QUERY REWRITE]",
        "      * Code Reference    : dolphin_backend/services/chat_service.py (lines 2360-2385 -> rewrite_query())",
        "      * Model & Settings  : gpt-4o-mini | Max Tokens: 60",
        f"      * Standalone Query  : \"{standalone_query.strip()}\"",
        "",
        f"   {border_single}",
        "",
        "   [STEP 4: KNOWLEDGE RETRIEVAL (RAG)]",
        "      * Code Reference    : dolphin_backend/retrieval/faiss_store.py & services/chat_service.py (lines 2540-2650)",
        "      * Search Indexes    : FAISS Vector Index ('./storage/faiss_index') + PostgreSQL 'course_content'",
        "      * Search Algorithm  : Vector Embedding (text-embedding-3-small) + BM25 Hybrid Keyword",
        f"      * Chunks Selected   : {num_chunks} Course Document Chunk(s)",
        "      * Document Chunks Analyzed:",
    ]
    box2_lines.extend(doc_lines)
    if prompt_template_text is None:
        try:
            from pipeline.query import QUERY_PROMPT
            prompt_template_text = QUERY_PROMPT
            prompt_start_line = 18
            prompt_end_line = 170
        except Exception:
            pass

    box2_lines.extend([
        "",
        f"   {border_single}",
        "",
        "   [STEP 5: PROMPT ASSEMBLY & AI ANSWER GENERATION]",
        f"      * Code Reference    : {prompt_file} (lines {prompt_start_line}-{prompt_end_line} -> {prompt_template_name})",
        f"      * Prompt Template   : {prompt_template_name}",
        f"      * LLM Model In Use  : {model_name}",
        "      * Configuration     : Temperature: 0.0 | Max Tokens: 2500 | Response Format: JSON",
        f"      * Injected Context  : Persona ({user_name}, {user_role}) + {num_chunks} Course Chunks + Chat History",
    ])

    if prompt_template_text:
        box2_lines.append("")
        box2_lines.append(f"      * FULL PROMPT TEMPLATE SOURCE CODE ({prompt_file} -> Lines {prompt_start_line} to {prompt_end_line}):")
        box2_lines.append("        " + "-" * 84)
        tmpl_lines = prompt_template_text.strip().split("\n")
        for offset, l in enumerate(tmpl_lines):
            line_no = prompt_start_line + offset
            box2_lines.append(f"        [Line {line_no:03d}] {l}")
        box2_lines.append("        " + "-" * 84)

    box2_lines.extend([
        "",
        f"   {border_single}",
        "",
        "   [STEP 6: COURSE MEDIA ENRICHMENT]",
        f"      * Code Reference    : dolphin_backend/services/chat_service.py (lines 1530-1640 -> _build_video_suggestions())",
        "      * Source Database   : PostgreSQL 'course_content' (topic_video & topic_image columns)",
        f"      * Matched Assets    : {len(videos)} Video Tutorial(s), {len(images)} Diagram Image(s)",
        "",
        border_double,
        "",
    ])
    _safe_print("\n".join(box2_lines))

    # -------------------------------------------------------------------------
    # BOX 3: RESPONSE FIELD
    # -------------------------------------------------------------------------
    t_retrieval = latencies.get("retrieval_chunks", latencies.get("initial_retrieval", 0.0))
    t_gen = latencies.get("answer_generation", 0.0)
    t_total = latencies.get("pipeline_total", 0.0)

    # Preview answer cleanly
    resp_clean = response_content.strip()
    if len(resp_clean) > 500:
        resp_preview = resp_clean[:500] + "..."
    else:
        resp_preview = resp_clean or "(No text response)"

    # Format media list
    media_lines: List[str] = []
    for idx, v in enumerate(videos[:3], 1):
        v_title = v.get("Title") or v.get("title") or "Video Tutorial"
        v_url = v.get("Url") or v.get("url") or "N/A"
        media_lines.append(f"      * [Video {idx}] \"{v_title}\" - {v_url}")
    for idx, img in enumerate(images[:2], 1):
        img_url = img.get("Url") or img.get("url") or img.get("image_url") or "N/A"
        media_lines.append(f"      * [Image {idx}] {img_url}")

    if not media_lines:
        media_lines.append("      * None attached for this query")

    # Format unique topics
    topics_str = ", ".join(f'"{t}"' for t in list(seen_topics)[:4]) if seen_topics else "None"

    delivery_mode = "200 OK via Server-Sent Events (SSE)" if "stream" in api_endpoint.lower() else "200 OK via JSON REST Response"

    box3_lines = [
        border_double,
        "[BOX 3: RESPONSE FIELD]",
        border_double,
        "   Performance Timings:",
        f"      * Retrieval Latency : {t_retrieval:.2f}s",
        f"      * LLM Latency       : {t_gen:.2f}s",
        f"      * Total End-to-End  : {t_total:.2f}s",
        "",
        "   Course Documents Utilized:",
        f"      * {len(seen_topics)} Unique Course Topic(s): {topics_str}",
        "",
        "   Attached Media Assets:",
    ]
    box3_lines.extend(media_lines)
    box3_lines.extend([
        "",
        "   AI Generated Response (Delivered to User):",
    ])

    # Indent preview lines
    wrapped_preview = textwrap.fill(resp_preview, width=86)
    for line in wrapped_preview.split("\n"):
        box3_lines.append(f"   {line}")

    if company_answer:
        box3_lines.extend([
            "",
            "   Company Guidance Attached:",
            f"   {company_answer[:200]}...",
        ])

    box3_lines.extend([
        "",
        f"   Stream Delivery : {delivery_mode}",
        border_double,
        "",
    ])
    _safe_print("\n".join(box3_lines))


# =============================================================================
# 2. LOGIN EXECUTION BOXES (POST /login, POST /login/login1, POST /login/test-login)
# =============================================================================
def print_login_execution_boxes(
    user_name: str,
    user_id: str,
    email: str,
    role_name: str,
    ship_name: str,
    company_name: str,
    company_id: str,
    api_endpoint: str = "POST /login",
    auth_method: str = "Dolphin CMS Direct Authentication",
    company_courses_count: int = 0,
    token_preview: str = "eyJhbGciOi...",
    duration: float = 0.0,
    client_ip: Optional[str] = "127.0.0.1",
    status_code: int = 200,
    error_message: Optional[str] = None,
) -> None:
    """
    Prints a clean, structured 3-box terminal summary after the login operation completes.
    - Box 1: Request Field (User email/identifier, auth method, API endpoint, timestamp, IP)
    - Box 2: Background Operations Pipeline (Step-by-step with executing files and line numbers)
    - Box 3: Response Field (Tokens, user profile resolved, courses count, latency)
    """
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    border_double = "=" * 92
    border_single = "-" * 92

    is_success = (status_code == 200)

    # -------------------------------------------------------------------------
    # BOX 1: REQUEST FIELD
    # -------------------------------------------------------------------------
    box1_lines = [
        "",
        border_double,
        "[BOX 1: REQUEST FIELD]",
        border_double,
        f"   User Identifier : {email}",
        f"   Login Method    : {auth_method}",
        f"   API Endpoint    : {api_endpoint}",
        f"   Client IP       : {client_ip or 'Local Host'}",
        f"   Timestamp       : {now_str}",
        "",
        "   Authentication Request:",
        f"   User '{email}' initiating session via {api_endpoint}",
        border_double,
        "",
    ]
    _safe_print("\n".join(box1_lines))

    # -------------------------------------------------------------------------
    # BOX 2: BACKGROUND OPERATIONS PIPELINE
    # -------------------------------------------------------------------------
    step2_verif = "SUCCESS (Active Maritime Seafarer Verified)" if is_success else f"FAILED: {error_message or 'Authentication rejected'}"
    step6_auth = "Complete Marine Tutor AI Platform Access Granted" if is_success else "DENIED (Credentials Rejected)"

    box2_lines = [
        border_double,
        "[BOX 2: BACKGROUND OPERATIONS PIPELINE]",
        border_double,
        "",
        "   [STEP 1: CREDENTIAL PARSING & SANITIZATION]",
        "      * Code Reference    : dolphin_backend/api/login_router.py (lines 40-56)",
        f"      * Auth Protocol     : {auth_method}",
        f"      * Target Identity   : {email}",
        "",
        f"   {border_single}",
        "",
        "   [STEP 2: DOLPHIN CMS AUTHENTICATION & IDENTITY CHECK]",
        "      * Code Reference    : dolphin_backend/services/auth_service.py (lines 190-203 -> authenticateDolphin())",
        "      * External Provider : https://cms.marinerskills.com/api/login",
        "      * Security Protocol : FslKviDfp2tH3qeZla00hp (CMS SHA-256 Verification Key)",
        f"      * Verification      : {step2_verif}",
        "",
        f"   {border_single}",
        "",
        "   [STEP 3: POSTGRESQL USER PROFILE SYNCHRONIZATION]",
        "      * Code Reference    : dolphin_backend/api/login_router.py (lines 52-112 -> create_or_update_user())",
        "      * Target Database   : PostgreSQL 'users' & 'user_roles' tables",
        f"      * Assigned User ID  : {user_id}",
        f"      * Name & Role       : {user_name} | {role_name}",
        f"      * Vessel Assigned   : {ship_name}",
        f"      * Company Assigned  : {company_name} (ID: {company_id})",
        "",
        f"   {border_single}",
        "",
        "   [STEP 4: COMPANY COURSE CATALOG SYNCHRONIZATION]",
        "      * Code Reference    : dolphin_backend/api/login_router.py (lines 219-236)",
        "      * External API      : https://cms.marinerskills.com/api/companycourses",
        f"      * Synchronized      : {company_courses_count} Assigned Maritime Training Course(s)",
        "",
        f"   {border_single}",
        "",
        "   [STEP 5: IN-MEMORY REDIS PROFILE CACHING]",
        "      * Code Reference    : dolphin_backend/core/redis_client.py (lines 45-85 -> set_user_data())",
        f"      * Redis Key Target  : user:{user_id}:data",
        f"      * Session Cache     : {'Active (Profile & Company Courses Cached in RAM)' if is_success else 'Bypassed (Auth Failed)'}",
        "",
        f"   {border_single}",
        "",
        "   [STEP 6: JWT AUTHORIZATION TOKEN ISSUANCE]",
        "      * Code Reference    : dolphin_backend/api/access_control.py (lines 15-40 -> create_access_token())",
        f"      * Cryptography      : {'HS256 JWT Signed Bearer Token (24h Expiry)' if is_success else 'None'}",
        f"      * Authorization     : {step6_auth}",
        "",
        border_double,
        "",
    ]
    _safe_print("\n".join(box2_lines))

    # -------------------------------------------------------------------------
    # BOX 3: RESPONSE FIELD
    # -------------------------------------------------------------------------
    outcome_status = "200 OK (Login Successful)" if is_success else f"{status_code} Error ({error_message or 'Login Failed'})"
    box3_lines = [
        border_double,
        "[BOX 3: RESPONSE FIELD]",
        border_double,
        "   Performance Timings:",
        f"      * Authentication Latency : {duration:.3f}s",
        "",
        "   Authentication Outcome:",
        f"      * HTTP Status        : {outcome_status}",
        f"      * Assigned User ID   : {user_id}",
        f"      * User Full Name     : {user_name}",
        f"      * Registered Email   : {email}",
        f"      * Assigned Role      : {role_name}",
        f"      * Organization       : {company_name}",
        f"      * Course Count       : {company_courses_count} Course(s) Available",
        f"      * Access Token       : {token_preview if is_success else 'None'}",
        "",
        f"   Session Delivery : {'200 OK (Bearer Token & User Profile Returned)' if is_success else f'{status_code} Error Response'}",
        border_double,
        "",
    ]
    _safe_print("\n".join(box3_lines))


# =============================================================================
# 3. GENERIC OPERATION BOXES (Quiz, Session Management, Feedback, etc.)
# =============================================================================
def print_operation_execution_boxes(
    operation_name: str,
    api_endpoint: str,
    user_id: Optional[str] = "N/A",
    user_name: Optional[str] = "User",
    session_id: Optional[str] = "N/A",
    request_details: Optional[Dict[str, Any]] = None,
    pipeline_steps: Optional[List[Dict[str, Any]]] = None,
    response_details: Optional[Dict[str, Any]] = None,
    duration: float = 0.0,
) -> None:
    """
    Universal 3-box logger for all other backend operations (Quiz, Sessions, Feedback, Sync).
    Ensures EVERY operation adheres to the same clean 3-box format with line references.
    """
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    border_double = "=" * 92
    border_single = "-" * 92

    request_details = request_details or {}
    pipeline_steps = pipeline_steps or []
    response_details = response_details or {}

    # -------------------------------------------------------------------------
    # BOX 1: REQUEST FIELD
    # -------------------------------------------------------------------------
    box1_lines = [
        "",
        border_double,
        f"[BOX 1: REQUEST FIELD - {operation_name.upper()}]",
        border_double,
        f"   Operation    : {operation_name}",
        f"   User Name    : {user_name or 'N/A'}",
        f"   User ID      : {user_id or 'N/A'}",
        f"   Session ID   : {session_id or 'N/A'}",
        f"   API Endpoint : {api_endpoint}",
        f"   Timestamp    : {now_str}",
        "",
        "   Inbound Parameters:",
    ]
    for k, v in request_details.items():
        box1_lines.append(f"      * {k:16}: {str(v)}")
    box1_lines.extend([
        border_double,
        "",
    ])
    _safe_print("\n".join(box1_lines))

    # -------------------------------------------------------------------------
    # BOX 2: BACKGROUND OPERATIONS PIPELINE
    # -------------------------------------------------------------------------
    box2_lines = [
        border_double,
        "[BOX 2: BACKGROUND OPERATIONS PIPELINE]",
        border_double,
        "",
    ]
    for idx, step in enumerate(pipeline_steps, 1):
        step_title = step.get("title", f"STEP {idx}")
        code_ref = step.get("code_ref", "N/A")
        box2_lines.append(f"   [STEP {idx}: {step_title.upper()}]")
        box2_lines.append(f"      * Code Reference    : {code_ref}")
        for sk, sv in step.items():
            if sk not in ("title", "code_ref"):
                box2_lines.append(f"      * {sk:18}: {str(sv)}")
        box2_lines.append("")
        if idx < len(pipeline_steps):
            box2_lines.append(f"   {border_single}")
            box2_lines.append("")

    box2_lines.extend([
        border_double,
        "",
    ])
    _safe_print("\n".join(box2_lines))

    # -------------------------------------------------------------------------
    # BOX 3: RESPONSE FIELD
    # -------------------------------------------------------------------------
    box3_lines = [
        border_double,
        "[BOX 3: RESPONSE FIELD]",
        border_double,
        "   Performance Timings:",
        f"      * Operation Latency  : {duration:.3f}s",
        "",
        "   Operation Outcome:",
        f"      * HTTP Status        : 200 OK ({operation_name} Executed Successfully)",
    ]
    for rk, rv in response_details.items():
        box3_lines.append(f"      * {rk:18}: {str(rv)}")
    box3_lines.extend([
        "",
        f"   Delivery Status : 200 OK via REST Response",
        border_double,
        "",
    ])
    _safe_print("\n".join(box3_lines))
