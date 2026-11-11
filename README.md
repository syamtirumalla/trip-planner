# AI Trip Planner

An intelligent, interactive travel itinerary generator that transforms free-form travel ideas (e.g., *"4 days in Kyoto in April, love food and temples, mid budget"*) into structured, day-by-day itineraries. Unlike standard AI chatbots that dump markdown text, this application processes model outputs through a strict validation, salvage, and repair pipeline into fully typed data. Users can interact with their itinerary through expandable stop cards with estimated costs and local tips, drag-and-drop stop reordering with instant schedule recalculation, a 6-second undo toast queue for stop removals, mobile-optimized WAI-ARIA day tabs, conversational itinerary refinements with persistent stop IDs, automatic local persistence, and instant dark mode.

<!-- SCREENSHOT PLACEHOLDER -->
<!-- Insert application screenshot or animated GIF here -->

<!-- DEMO VIDEO LINK PLACEHOLDER -->
<!-- Demo Video: [Watch 2-Minute Walkthrough](https://your-demo-video-link-here) -->

---

## Setup & Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- An API key from either **Groq** (recommended for speed) or **Google Gemini**

### Installation & Running

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd "Trip planner"
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```

3. **Start the application**:
   ```bash
   npm start
   ```
   This concurrently boots:
   - **Express API Server**: `http://localhost:3001`
   - **Vite React Frontend**: `http://localhost:5173` (with `/api` proxy configured to `:3001`)

### Environment Variables

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `number` | `3001` | Express backend listening port |
| `NODE_ENV` | `string` | `development` | Set to `production` to hide Dev Failure Simulators and disable `x-simulate` headers |
| `PROVIDER` | `string` | `groq` | Active AI provider (`groq` or `gemini`) |
| `MODEL_TIMEOUT_MS`| `number` | `45000` | Hard network timeout for upstream LLM completion requests (ms) |
| `MAX_OUTPUT_TOKENS`| `number` | `4096` | Output token boundary for Gemini calls (Groq uses 8192 to account for reasoning tokens) |
| `GROQ_API_KEY` | `string` | `""` | Groq Cloud API key (required if `PROVIDER=groq`) |
| `GROQ_MODEL` | `string` | `openai/gpt-oss-20b` | Target Groq model identifier |
| `GEMINI_API_KEY` | `string` | `""` | Google AI Studio Gemini API key (required if `PROVIDER=gemini`) |
| `GEMINI_MODEL` | `string` | `gemini-3.8-flash` | Target Google Gemini model identifier |

### Obtaining API Keys

- **Groq API Key**:
  1. Visit the [Groq Cloud Console](https://console.groq.com/).
  2. Sign in or create a free account.
  3. Navigate to **API Keys** &rarr; **Create API Key**.
  4. Paste into `.env` as `GROQ_API_KEY=gsk_...`.
- **Gemini API Key**:
  1. Visit [Google AI Studio](https://aistudio.google.com/).
  2. Sign in with your Google Account.
  3. Click **Get API key** &rarr; **Create API key**.
  4. Paste into `.env` as `GEMINI_API_KEY=AIza...`.

### Switching Providers

The entire architecture sits behind a swappable `callModel(prompt)` provider interface. To switch between providers, change `PROVIDER` in `.env`:
```env
# Use Groq (ultra-fast, ~2s responses)
PROVIDER=groq

# Or use Gemini
PROVIDER=gemini
```
Restart the server (`npm start`) after modifying `.env`. No frontend changes are required.

---

## How It Works

### Architecture & Data Flow

```text
[ User Prompt / Refinement ]
             │
             ▼
[ Client React SPA (Vite :5173) ]
  • Pure plannerReducer (idle | loading | error | success)
  • Stale-response protection (requestId + AbortController)
             │
             │ POST /api/plan or /api/refine
             ▼
[ Express Server (:3001) ]
  1. Validate Input (Zod 4 Schema)
  2. Check Dev Simulation (x-simulate header in non-prod)
  3. Build System Prompt (Deterministic JSON instructions)
  4. callModel(prompt) [Groq or Gemini via raw fetch]
  5. extractJson(rawText) [Fences, raw JSON, or salvage]
  6. validateAndSalvage(json) [Stop-by-stop schema verification]
     ↳ If failed: Trigger buildRepairPrompt() Retry
  7. semanticCheck(prompt, itinerary) [Check requested vs generated days]
             │
             ▼ JSON { itinerary, warnings }
[ Client Processing ]
  • Client-side Zod 4 Re-validation
  • ID Reconciliation (reconcileItinerary preserves stop IDs)
  • Dynamic Time Recomputation (recomputeTimes)
  • Auto-Save to localStorage (trip_planner_v1)
             │
             ▼
[ Interactive UI Rendering ]
  • WAI-ARIA Day Tabs (< 768px) / Stacked Sections (>= 768px)
  • @dnd-kit Drag-and-Drop Reordering
  • 6-Second Undo Toast Queue (Max 3 visible)
  • Conversational Refinement Loop with Undo
```

### 1. The Shared Schema (`shared/schema.js`)
Validation rules are centralized in a single module shared between the Express backend and Vite frontend using **Zod 4**:
- **`StopSchema`**: Validates stop `name`, `type` (`food`, `sight`, `activity`, `transit`, `rest`), `durationMin` (15 to 480 minutes), `description`, optional `costEstimate`, and optional `tip`.
- **`DaySchema`**: Validates `label`, `startTime` (regex `^([01]\d|2[0-3]):[0-5]\d$`, default `'09:00'`), and an array of stops.
- **`ItinerarySchema`**: Validates `title`, optional `summary`, and `days` array (minimum 1 day).
- **`PlanRequestSchema` / `RefineRequestSchema`**: Validates user inputs with strict character bounds (5 to 1,000 characters).

### 2. The Server Pipeline
1. **Prompt Engineering (`server/services/promptBuilder.js`)**:
   Enforces strict structured JSON output rules. For specific day requests (e.g. "4 days"), it demands exactly that number of days, at least 3 stops per day, realistic daily pacing (8–10 hours), sensible meal timing (breakfast/lunch before mid-afternoon, dinner last), and forbids filler stops like "Hotel Rest".
2. **Unified Model Client (`server/services/modelClient.js`)**:
   Executes requests with raw `fetch` with configurable timeouts (`MODEL_TIMEOUT_MS`).
   - **Groq**: Calls `/openai/v1/chat/completions` using JSON Mode (`response_format: { type: 'json_object' }`), `reasoning_effort: 'low'`, and `max_tokens: 8192`. Detects truncation (`finish_reason: 'length'`) and retries with doubled token bounds.
   - **Gemini**: Calls `v1beta/models/{model}:generateContent` using `generationConfig.thinkingConfig = { thinkingLevel: 'low' }` and `maxOutputTokens: 4096`. Retries transient 503 errors with exponential backoff.
   - Logs latency, HTTP status, and truncation flags without leaking API keys. Sanitizes raw upstream provider errors into user-friendly error codes.
3. **JSON Extraction (`server/services/jsonExtractor.js`)**:
   Strips markdown code blocks (` ```json ... ``` `), detects root object boundaries, and extracts clean JSON strings even when wrapped in conversational chatter.
4. **Stop-by-Stop Validation & Salvage (`server/services/validator.js`)**:
   Instead of discarding an entire itinerary when a single stop has an invalid enum or negative duration, the salvage pipeline validates each stop individually. Valid stops are preserved, invalid stops are omitted with user-visible warnings, and start times fall back to `'09:00'` if malformed.
5. **One-Shot Repair Retry**:
   If raw model output cannot be parsed or salvaged, the server invokes `buildRepairPrompt()` with the exact error details to give the model a single chance to repair the JSON syntax before failing.
6. **Semantic Day-Count Check (`server/services/semanticCheck.js`)**:
   Extracts user-requested day counts (e.g., "4 days", "a week", "long weekend") and compares them against the number of generated days. If fewer days were produced, a non-blocking warning alerts the user: *"You asked for 4 days but only 2 were generated."*

### 3. Client Architecture & UX
- **Pure Reducer State Machine (`client/src/state/plannerReducer.js`)**:
  Manages transitions across `idle`, `loading`, `error`, and `success`. All time calculations and day reorderings remain pure functions.
- **Stale-Response Protection**:
  An incrementing `requestIdRef` combined with `AbortController` guarantees that if a user submits prompt B while prompt A is in-flight, any late arrival from prompt A is silently discarded.
- **Dynamic Time Calculation (`client/src/utils/time.js`)**:
  Stop start times are calculated via pure cumulative duration math (`day.startTime` + preceding stop durations), updating instantly whenever stops are deleted, reordered, or moved.
- **Drag-and-Drop Reordering (`@dnd-kit`)**:
  Integrated with pointer, touch (200ms press threshold), and keyboard (`Space`/`Enter` + arrow keys) sensors. An isolated drag handle (`⋮⋮`) prevents drag interactions from intercepting the card expansion toggle or removal button.
- **6-Second Undo Toast Queue (`client/src/components/Toast.jsx`)**:
  Removed stops trigger a 6-second countdown toast with a real-time progress bar. To prevent blocking the stop removal buttons (`✕`), the visible queue is capped at 3 toasts (collapsing older removals into a "+N more" undoable badge), narrowed to 320px on desktop, and docked full-width on mobile above the safe area with dynamic page bottom padding.
- **Mobile Day Tabs (`client/src/components/itinerary/DayTabs.jsx`)**:
  On viewports below 768px, stacked days automatically switch to a horizontal tab bar adhering to the WAI-ARIA Tabs specification (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, roving `tabIndex`, and Arrow Left/Right/Home/End navigation).
- **Conversational Refinement Loop (`client/src/components/itinerary/RefineForm.jsx`)**:
  Enables follow-up adjustments (e.g., *"make day 2 more relaxed"*) via `/api/refine`. `reconcileItinerary` preserves persistent client-side IDs for unchanged stops, keeping React DOM elements stable. Includes an "Undo refinement" action to revert to the previous itinerary.
- **Versioned LocalStorage (`client/src/utils/storage.js`)**:
  Auto-saves itineraries under key `trip_planner_v1`. On reload, stored data is re-validated through `ItinerarySchema`; outdated or corrupted entries are cleanly purged rather than crashing the client. Includes a "Clear saved trip" button.
- **Accessible Dark Mode**:
  Defaults to `prefers-color-scheme`, toggleable via CSS variables. A synchronous `<head>` script in `client/index.html` prevents any flash of the wrong theme on load.

---

## Failure Modes I Handle

The table below outlines every failure scenario, how the system responds, and how developers can simulate each mode in development using the **Failure Simulator** UI dropdown or raw HTTP headers:

| Failure Mode | What the User Sees | How It's Handled Under the Hood | Simulation (`x-simulate` header) |
| :--- | :--- | :--- | :--- |
| **Malformed JSON** | Clean itinerary with repair warning, or clear `MALFORMED` alert if repair fails | Server detects unparseable JSON, attempts one-shot repair prompt retry. If repair fails, returns HTTP 400 `MALFORMED`. | `x-simulate: malformed` |
| **Wrong Schema / Bad Shape** | Helpful error alert: *"The response did not match our itinerary structure"* | Zod verification fails; server attempts repair. If unsalvageable, returns HTTP 400 `WRONG_SHAPE`. Client re-validates to catch edge cases. | `x-simulate: wrong-shape` |
| **Empty Model Output** | Error alert: *"No itinerary content was generated. Please expand your trip description"* | Throws `EMPTY` code; maps to user-friendly message rather than crashing parser. | `x-simulate: empty` |
| **Upstream Timeout (504)** | Error alert: *"The AI request timed out... try a shorter prompt or retry"* | Request bounded by `MODEL_TIMEOUT_MS` (45s) via `AbortController`. Returns HTTP 504 `TIMEOUT`. | `x-simulate: slow` |
| **Upstream Service Error (500/502)** | Error alert: *"The AI service encountered an upstream issue. Please retry"* | Maps upstream 5xx responses to typed `UPSTREAM` code; hides raw Google/Groq internal traces from the client. | `x-simulate: http500` |
| **Rate Limiting (429)** | Error alert: *"We hit the AI service rate limit. Please wait 10 seconds"* | Upstream 429 captured and mapped to typed `RATE_LIMITED` error with retry action. | `x-simulate: rate-limit` |
| **Partial Stop Corruption** | Full itinerary displayed with yellow banner: *"2 stops couldn't be loaded and were omitted"* | Salvage pipeline drops only broken stops (invalid durations, unknown enums) and preserves valid stops. | `x-simulate: partial` |
| **Token Truncation (`finish_reason: length`)** | Seamless itinerary generation (or clear error if max tokens exhausted) | Server inspects `finish_reason`. If truncated by token limits, automatically retries once with doubled token ceiling (up to 16,384 tokens). | Model output boundary trigger |
| **Day Count Mismatch** | Yellow banner: *"You asked for 4 days but only 2 were generated"* | `semanticCheck.js` parses requested days from prompt text and compares with generated days array. Non-blocking warning rendered. | Short output on multi-day prompt |
| **Stale Network Response** | Old response silently discarded; correct request displayed | Each request increments `activeRequestId`. Responses returning with mismatched IDs are ignored by `plannerReducer`. | Double-clicking submit / rapid typing |
| **Corrupted LocalStorage** | Application starts clean; corrupted storage discarded | `loadSavedItinerary()` runs stored JSON through `ItinerarySchema.safeParse()`. Corrupted data is purged. | Corrupting `trip_planner_v1` in DevTools |

*Note: The Dev Failure Simulator and `x-simulate` headers are strictly ignored and disabled when `NODE_ENV=production`.*

---

## Tests

The project includes an automated test suite executed with **Vitest**:

```bash
npm test
```

### Test Coverage Summary (84 Passing Tests Across 11 Suites)

1. **`server/__tests__/groqClient.test.js`**: Verifies Groq OpenAI-compatible completions format, provider switching via `PROVIDER` env var, HTTP 429/500/timeout error mapping, and token truncation detection (`finish_reason: 'length'`).
2. **`server/__tests__/jsonExtractor.test.js`**: Validates extraction from raw JSON, markdown-fenced blocks, text with leading/trailing chatter, and nested structures.
3. **`server/__tests__/validator.test.js`**: Validates stop-by-stop salvage, dropping corrupted durations/enums, day omission when all stops fail, and fallback start times.
4. **`server/__tests__/semanticCheck.test.js`**: Tests day count extraction from natural phrases (*"4 days"*, *"a week"*, *"long weekend"*) and mismatch warning generation.
5. **`server/__tests__/simulator.test.js`**: Tests dev failure simulator routes, simulation keys, and production isolation.
6. **`client/src/state/__tests__/plannerReducer.test.js`**: Tests state machine transitions (`idle`, `loading`, `error`, `success`), strict `requestId` stale response guarding, dynamic start time recalculation on stop deletion, restoration at original index, drag-and-drop reordering, cross-day moves, and refinement transitions.
7. **`client/src/utils/__tests__/time.test.js`**: Tests pure time calculations (`recomputeTimes`, `addMinutesToTime`, `formatDuration`).
8. **`client/src/utils/__tests__/storage.test.js`**: Verifies versioned `localStorage` auto-save, Zod re-validation on load, purging corrupted/outdated data, and handling restricted/disabled storage contexts.
9. **`client/src/utils/__tests__/tabs.test.js`**: Tests WAI-ARIA tab keyboard navigation logic (ArrowRight, ArrowLeft, Home, End, and cyclical wrap-around).
10. **`client/src/utils/__tests__/reconcile.test.js`**: Tests client-side ID reconciliation between original and refined itineraries to ensure stable DOM keys.
11. **`client/src/hooks/__tests__/useTheme.test.js`**: Verifies dark mode initial state, `prefers-color-scheme` matching, and local storage persistence.

---

## Provider Comparison (Real Measured Numbers)

During development, we benchmarked identical multi-day itinerary prompts (*"3 days in Rome"* and *"6 days in Japan"*) across both providers:

| Metric | Google Gemini (`gemini-3.8-flash`) | Groq Cloud (`openai/gpt-oss-20b`) |
| :--- | :--- | :--- |
| **Average Response Time (3-Day Trip)** | **28.4s – 42.1s** (frequently hit 30s timeout) | **1.8s – 2.4s** |
| **Average Response Time (6-Day Trip)** | **38.0s – 52.3s** (required timeout increase) | **3.1s – 4.2s** |
| **Transient Error Rate** | Occasional HTTP 503 / endpoint capacity spikes | Near 0% |
| **JSON Mode Support** | Prompt-driven markdown fences | Native `response_format: { type: "json_object" }` |
| **Output Token Considerations** | `thinkingConfig: { thinkingLevel: 'low' }` | **Critical Discovery**: `reasoning_tokens` count against `max_tokens`. Solved by setting `reasoning_effort: 'low'` and `max_tokens: 8192`. |

### Why the Swappable Provider Layer Matters
Relying on a single AI provider introduces systemic risks: Google's endpoint deprecations (Gemini 2.5 Flash deprecation for new accounts) and intermittent demand latency spikes caused user timeouts. By decoupling model execution behind a clean `callModel(prompt)` signature, switching providers requires changing one environment variable, keeping the validation, repair, salvage, and frontend pipelines untouched.

---

## Decisions & Trade-offs

1. **Plain `fetch` Instead of Vendor SDKs (`@google/genai`, `groq-sdk`)**:
   - *Why*: Eliminates hundreds of third-party dependencies, keeps the bundle minimal, avoids breaking changes between SDK major versions, and allows identical `AbortController` and timeout handling across both providers.
2. **Plain CSS & CSS Custom Properties Instead of Tailwind / Component Libraries**:
   - *Why*: Eliminates build-time dependencies, provides zero runtime overhead, enables instant zero-flash dark mode via `data-theme` and `:root` custom properties, and keeps the codebase simple and maintainable.
3. **No LLM Streaming**:
   - *Why*: Streaming structured JSON requires progressive parsing or complex partial tree rendering. Because our resilience model relies on stop-by-stop schema verification, repair prompts, and day-count checks before presenting the trip to the user, complete atomic validation was prioritized over character-by-character token streaming.
4. **Stop-Level Salvage Over All-or-Nothing Failure**:
   - *Why*: If a model returns 15 valid stops and 1 stop with an invalid duration, failing the entire request frustrates the user. Dropping the single offending stop and displaying an informative warning banner provides a resilient, forgiving user experience.

---

## Known Limitations

- **Model Content Quality & Hallucinations**: Generated recommendations reflect model training data and may occasionally suggest closed venues, inaccurate ticket prices, or outdated operating hours.
- **Geography & Routing Realism**: While prompt engineering instructs the model to group stops logically, LLMs lack a real GIS routing engine. Stops may not follow an optimal geographic driving/walking path.
- **Meal Ordering**: Prompt constraints instruct breakfast/lunch before afternoon and dinner as the final stop, but complex prompts with many user constraints can occasionally cause meal placement anomalies.
- **Intermittent Day Count Drift**: Models occasionally return fewer days than requested for long trips (e.g. returning 3 days for a 5-day request). Handled via non-blocking semantic check warnings alerting the user.
- **No Component Click Tests**: Unit tests thoroughly cover the reducer, time calculations, salvage, storage, and API routes (84 tests), but component-level click simulations were omitted to avoid introducing additional testing libraries (`@testing-library/react` / jsdom) outside the agreed dependencies.
- **Free-Tier Limits**: Both Groq and Gemini free tiers enforce rate limits (requests per minute and tokens per minute).
- **Client-Side Persistence Only**: Data is saved to the browser's `localStorage`; there is no backend database or multi-device user account authentication.

---

## What I'd Do Next

1. **Mapbox / Google Maps Integration**: Plot stops on an interactive map with walking and transit routes between sequential stops.
2. **Google Places Verification**: Ground LLM-suggested stop names, addresses, ratings, and opening hours against the Google Places API.
3. **Calendar Export (.ics / Google Calendar)**: Allow one-click export of the daily itinerary into Google Calendar or Apple Calendar.
4. **PDF / Shareable Trip Export**: Generate downloadable, printable travel PDFs or unique shareable links.
5. **Playwright End-to-End Tests**: Add end-to-end browser tests verifying drag-and-drop, tab switching, and undo toasts across Chromium, Firefox, and WebKit at desktop and mobile viewports.

---

## AI Usage Note

<!-- AI USAGE NOTE PLACEHOLDER -->
*To be filled in by the applicant detailing AI tools used, prompts, and assistance.*

---

## Time Spent

<!-- TIME SPENT PLACEHOLDER -->
*To be filled in by the applicant detailing hours spent across project phases.*
