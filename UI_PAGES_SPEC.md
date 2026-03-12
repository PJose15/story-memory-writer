# Story Memory Writer — Complete UI Pages Specification

## App-Level Design Language

- **Theme**: Dark mode only (zinc-950 background, zinc-100 text)
- **Accent**: Indigo (indigo-600 primary actions, indigo-400 highlights)
- **Status Colors**: Emerald = confirmed/success, Blue = flexible/info, Amber = draft/warning, Red = discarded/danger
- **Fonts**: Serif for headings (Playfair Display), Sans for body (Inter), Mono for code/technical (JetBrains Mono)
- **Corners**: Rounded (rounded-2xl for cards, rounded-xl for buttons, rounded-full for badges)
- **Animations**: Smooth fade-in + slide-up on page/card entry, smooth transitions on hover
- **Icons**: Lucide icon set (line icons, 20px default)
- **Layout**: Fixed sidebar (left) + scrollable main content (right). Sidebar collapses to hamburger on mobile.

---

## Global Shell

### Sidebar (always visible on desktop, drawer on mobile)
- **Position**: Fixed left, full height, ~240px wide
- **Header**: App name "Story Memory" with subtitle "CanonKeeper v1.0" and a book icon
- **Navigation Links** (vertical list, icon + label for each):
  1. Dashboard (LayoutDashboard icon)
  2. Manuscript (BookOpen icon)
  3. Flow Mode (Feather icon)
  4. Story Bible (BookMarked icon)
  5. Characters (Users icon)
  6. Timeline (Clock icon)
  7. Conflicts (Swords icon)
  8. Canon Lock (Lock icon)
  9. Assistant (Bot icon)
  10. Import (Upload icon)
  11. Writing Map (Map icon)
- **Active State**: Highlighted background (indigo-500/10) + indigo text + left border accent
- **Footer**: Settings link (gear icon) pinned to bottom
- **Mobile**: Hamburger button top-left, sidebar slides in as overlay with backdrop blur

### Entry Flow (Overlays — shown before main content on each session)

**Step 1: Diagnostic Overlay** (full-screen overlay, dark backdrop)
- Asks the writer about their emotional state
- 4 options presented as large clickable cards:
  - FEAR: "I feel watched or judged"
  - PERFECTIONISM: "I need it to be perfect"
  - DIRECTION: "I don't know what happens next"
  - EXHAUSTION: "I'm running on empty"
- Skip button available
- Selection sets the session's block type (affects AI assistant tone)

**Step 2: Ritual Overlay** (full-screen overlay, animated particles background)
- Two ritual options:
  - **Inspiration**: Shows a writer's quote with 60-second countdown timer. Progress bar at bottom. "Enter your story" button unlocks after timer completes.
  - **Mindfulness**: 4-4-4 breathing guide (animated pulsing circle: 4s inhale, 4s hold, 4s exhale). After completion, transitions to quote display.
- Visual: Ambient floating particles in background, centered content, large serif quote text, attribution below

---

## Page 1: Dashboard (`/`)

**Purpose**: Landing page showing story health at a glance.

**Layout**: Single column, max-width ~1024px, centered.

**Sections (top to bottom)**:

1. **Story Header**
   - Story title (large serif, h1)
   - Synopsis below (muted text, 2-3 lines max)

2. **Stats Cards Row** (4 cards in a horizontal grid)
   - Each card: Large number (2xl font), label below, subtle icon
   - Cards: Chapters count, Characters count, Timeline Events count, Active Conflicts count
   - Each card is clickable (navigates to respective page)
   - Hover: slight scale + border glow

3. **Writer Block Nudge** (conditional — only shows if session has a blockType)
   - Amber/warm background card
   - Shows personalized message based on block type:
     - FEAR: "It's okay. Let's start small."
     - PERFECTIONISM: "Messy words are still words."
     - DIRECTION: "Your story has unresolved threads — let's use them."
     - EXHAUSTION: "Just one paragraph. That's enough."

4. **Recent Chapters** (last 3 chapters)
   - Vertical list of cards
   - Each: chapter title (serif), summary preview (2 lines, truncated), canon badge
   - If no chapters: empty state with icon + "No chapters yet" message

5. **Open Loops** (max 5 unresolved story threads)
   - Compact list with bullet-style items
   - Each: loop description, subtle "open" badge
   - If none: "No open loops"

---

## Page 2: Manuscript (`/manuscript`)

**Purpose**: Chapter management — create, edit, reorder, delete chapters.

**Layout**: Single column, max-width ~900px.

**Header Row**:
- "Manuscript" title (h1, serif) + total word count badge
- "+ Add Chapter" button (indigo, right-aligned)

**Chapter List** (vertical stack of cards):
Each chapter card:
- **Title bar**: Chapter title (large serif) + canon status badge (colored pill: Confirmed/Flexible/Draft/Discarded with icon)
- **Reorder buttons**: Up/down arrows (left side)
- **Action buttons**: Edit (pencil icon) + Delete (trash icon) — top-right, subtle until hover
- **Content preview**: First 4 lines of chapter content (line-clamped, muted text)
- **Word count**: Bottom-right, small muted text
- **Summary**: If present, shown below content in a slightly different background

**Edit Mode** (replaces card content when editing):
- Title input (large, full-width)
- Content textarea (tall — h-64, monospace feel)
- Summary textarea (medium — h-24)
- Canon status dropdown (4 options)
- Cancel / Save buttons at bottom

**Empty State**: Large feather/book icon, "No chapters yet. Start writing!" text, prominent "Add Chapter" button.

**Behavior**: Warns user about unsaved changes when navigating away during edit.

---

## Page 3: Flow Mode (`/flow`)

**Purpose**: Immersive, distraction-free writing experience. Full-screen takeover.

**Entry**: Shows chapter select modal first (if no chapter selected).

### Chapter Select Modal (full-screen overlay)
- Dark backdrop with blur
- Centered card listing all chapters as clickable buttons
- Each button: chapter number, title, summary preview
- Empty state: "No chapters yet" with link to Manuscript

### Flow Editor (full-screen, z-150, bg-zinc-950)

**Top Bar** (minimal, floating):
- Left: Heteronym selector dropdown (writer persona — shows avatar emoji + name)
- Center: Current chapter title
- Right cluster: Word count badge, Theater icon (voice switch), Shuffle icon (scene change), Mic icon (braindump), Clipboard icon (braindump history), Exit button (X)

**Voice Banner** (conditional — thin banner below top bar):
- Shows when guest heteronym is active
- Guest persona name + avatar, close button
- Amber/warm tinted

**Scene Change Banner** (conditional — yellow banner):
- Shows during active scene change (timer counting down from 60s)
- "Return to [chapter]" button + "Extend" button + countdown display

**Main Writing Area**:
- Giant textarea, centered, max-width ~800px
- Large serif font, transparent background
- No backspace/delete keys allowed (append-only for flow state)
- Placeholder: "Start writing... no backspace, no delete, just forward."
- Autofocus on load

**Momentum Glow** (background visual effect):
- Subtle radial glow behind the textarea
- Grows in intensity as the writer types continuously
- Fades when they stop (visual momentum feedback)

**Micro-Prompt Display** (below textarea, conditional):
- Appears after 30 seconds of inactivity
- Shows AI-generated writing prompt based on story context
- Loading state: shimmer/pulse animation
- Prompt text: italic, muted, centered

**Braindump Panel** (floating overlay, triggered by mic button):
- Voice recording interface
- Start/stop recording button (large, pulsing when active)
- Transcription preview
- "Add to document" button

**Braindump History Drawer** (slide-out from right):
- Previous braindump transcriptions
- Timestamps, text previews
- Click to re-read

**Flow Score Modal** (appears when exiting flow):
- "How was your flow?" prompt
- 5-point emoji scale: terrible / rough / okay / good / amazing
- Submit saves score to session record + dismisses

---

## Page 4: Story Bible (`/bible`)

**Purpose**: Core project metadata editor.

**Layout**: Single column, max-width ~800px. Clean form layout.

**Header**: Book icon + "Story Bible" title + "Save Changes" button (top-right, indigo)

**Form Sections** (stacked with spacing):

1. **Project Title**
   - Label: "Title"
   - Large text input (full-width, serif font for the value)

2. **Global Synopsis**
   - Label: "Synopsis"
   - Large textarea (~6 rows), placeholder: "What is this story about?"

3. **Style & Tone Profile**
   - Label: "Style Profile"
   - Textarea (~4 rows), placeholder: "e.g., Dark fantasy, fast-paced, lyrical prose"

4. **Current Author Intent**
   - Label: "Author Intent"
   - Textarea (~4 rows), placeholder: "What are you trying to achieve right now?"
   - Helper text: "This guides the AI assistant's suggestions"

**Save Behavior**: Button shows brief "Saved!" confirmation with checkmark.

---

## Page 5: Characters (`/characters`)

**Purpose**: Deep character management with states, relationships, and arc tracking.

**Layout**: Single column or 2-column grid for cards.

**Header**: "Characters" title + "+ Add Character" button

**Character Cards** (grid layout):
Each card:
- **Name** (large, serif) + **Role** badge (small pill: Protagonist/Antagonist/Supporting/etc.)
- **Canon status badge** (colored pill)
- **Core identity** snippet (1-2 lines, muted)
- **Relationships count** badge (e.g., "3 relationships")
- **Current State Indicator**: Colored dot/badge showing:
  - Stable (green)
  - Shifting (blue)
  - Under pressure (amber)
  - Emotionally conflicted (orange)
  - At risk of contradiction (red)
- **Dynamic Relationships** (expandable/collapsible section):
  - List of related characters with: target name, trust % bar, tension % bar, dynamics description
- **State History** (expandable):
  - Timeline of past emotional state changes with dates and context

**Edit Mode** (full form, replaces card or opens as expanded view):
- Name input
- Role input
- Description textarea
- Core identity textarea
- Canon status dropdown
- **Current State Section** (grid of inputs):
  - Emotional state, Visible goal, Hidden need, Current fear
  - Dominant belief, Emotional wound, Pressure level (dropdown: Low/Medium/High/Critical)
  - Current knowledge textarea
- **Relationships Manager**:
  - List of relationship rows: target character dropdown, trust slider (0-100), tension slider (0-100), dynamics textarea
  - "+ Add Relationship" button
  - Remove button per row
- Save / Cancel buttons

**Empty State**: Users icon + "No characters yet" + Add button.

---

## Page 6: Timeline (`/timeline`)

**Purpose**: Visual chronological timeline of story events.

**Layout**: Centered vertical timeline with alternating left/right event cards.

**Header**: "Timeline" title + "+ Add Event" button

**Timeline Visual**:
- Vertical line running down center of page
- Circular nodes on the line where events attach
- Event cards alternate left and right of the line
- Each card:
  - **Date label** (mono font, indigo background pill at top)
  - **Canon status badge**
  - **Description** (prose text, full paragraph)
  - **Impact** (if present — below a subtle border, different styling: italic or highlighted)
  - **Edit/Delete buttons** (subtle, appear on hover)

**Edit Mode**:
- Date input (text — "Year 1, Day 1" format)
- Description textarea
- Impact textarea
- Canon status dropdown
- Cancel / Save buttons

**Empty State**: Clock icon + "No timeline events yet"

---

## Page 7: Conflicts (`/conflicts`)

**Purpose**: Track active and resolved story conflicts.

**Layout**: 2-column grid of conflict cards.

**Header**: "Conflicts" title + "+ Add Conflict" button

**Conflict Cards**:
- **Status toggle** (left side): Clickable circle
  - Active = gray/white circle outline
  - Resolved = solid green circle with checkmark
- **Title** (large, serif — strikethrough + muted if resolved)
- **Canon status badge**
- **Description** (prose text, 3-4 lines)
- **Edit/Delete buttons** (top-right, subtle)

**Edit Mode**:
- Title input
- Description textarea
- Canon status dropdown
- "Mark as Resolved" checkbox/toggle
- Cancel / Save buttons

**Empty State**: Swords icon + "No conflicts tracked yet"

---

## Page 8: Canon Lock (`/canon`)

**Purpose**: Bulk canon status management across all entity types.

**Layout**: Full-width, 2-column card grid with filter bar at top.

**Header**: Lock icon + "Canon Lock" title + description text: "Control what's confirmed, flexible, draft, or discarded across your entire story."

**Filter Bar** (horizontal row):
- **Type filter** dropdown: All Types, Characters, Chapters, Scenes, Timeline, Conflicts, World Rules, Locations, Themes, Open Loops, Foreshadowing
- **Status filter** dropdown: All Statuses, Confirmed Canon, Flexible Canon, Draft Idea, Discarded

**Card Grid** (2 columns):
Each card:
- **Type badge** (top-left — small colored pill: "character", "chapter", etc.)
- **Current canon status badge** (top-right — colored pill)
- **Title** (large, serif)
- **Description** (3 lines, truncated)
- **Status Toggle Row** (bottom — 4 buttons in a row):
  - Confirmed (emerald), Flexible (blue), Draft (amber), Discarded (red)
  - Active status is highlighted, others are muted
  - Click to change status

**Empty State**: Filter icon + "No items match your filters"

---

## Page 9: Assistant (`/assistant`)

**Purpose**: AI-powered narrative chat assistant with structured responses.

**Layout**: Full-height chat interface (messages area + input bar).

**Header Row**:
- Bot icon + "Narrative Assistant" title
- Subtitle: "Chat with your story's memory"
- "Clear" button (right side, trash icon, red on hover)

**Messages Area** (scrollable, flex-grow):
- **User messages**: Right-aligned, indigo background bubble, rounded-2xl (rounded-tr-sm), white text
- **Assistant messages**: Left-aligned, zinc-900 background bubble with zinc-800 border, rounded-2xl (rounded-tl-sm)
- **Avatar circles**: User = indigo circle with user icon, Assistant = zinc circle with border + bot icon (indigo)
- **Blocked mode badge**: If active, amber banner inside message bubble: lock icon + "BLOCKED MODE ACTIVE"

**Structured Response Rendering** (inside assistant bubbles):
For normal responses:
- **Canon Conflicts box** (red background, AlertTriangle icon): Lists contradictions found
- **Recommendation** (main section): Markdown-rendered advice/analysis
- **Generated Text box** (indigo-tinted background, italic): Only if user asked for prose
- **Alternatives** (collapsible): Bullet list of alternative suggestions
- **Information Gaps** (collapsible, amber): What the AI needs clarified
- **Sources Referenced** (collapsible): Chips/tags showing which story elements were used
- **Validation Warnings** (amber text, small): Data quality issues
- **Confidence Notes** (footer, tiny muted text): Distinguishes facts from suggestions

For blocked mode responses:
- **Where Your Story Stands**: Current narrative state summary
- **Why You Might Be Blocked** (amber box): Block diagnosis
- **Possible Next Moves**: 3-5 option cards with label + description each
- **Best Recommended Move** (indigo box): Top recommendation
- **Scene Starter** (if provided): Opening lines in italic box

**Loading State**: Bot avatar + spinner + "Thinking about your story..."

**Continuity Audit Modal** (appears above input when audit runs):
- Shield icon + "Continuity Audit Results" title + dismiss (X) button
- **Status badge**: Clear (emerald), Warnings (amber), Contradictions (red)
- **Risks list**: Cards with severity badge (High=red, Medium=amber, Low=blue) + description + affected elements as tags
- **Suggested Corrections**: Bullet list
- **Safe Version**: Italic text block
- **Actions**: "Use Safe Version" button (neutral) + "Proceed Anyway" button (red-tinted)

**Input Area** (bottom, sticky):
- **Quick action chips** (above textarea): "I'm blocked" + "Help me continue" — small rounded-full buttons
- **Textarea**: Full-width, rounded-2xl, 3 rows tall, max 5000 chars
  - Placeholder: "Ask about your story, request ideas, or say 'I'm stuck'..."
  - Enter to send, Shift+Enter for newline
- **Action buttons** (absolute, bottom-right inside textarea area):
  - Continuity Audit button (amber, shield icon)
  - Send button (indigo, send/arrow icon)

---

## Page 10: Import (`/import`)

**Purpose**: Ingest manuscripts (PDF, DOCX, TXT, MD) and extract structured story data.

**Layout**: Single column, max-width ~900px. Multi-step wizard.

### Step 1: Upload
- **Drag & Drop Zone**: Large dashed-border area, centered
  - Upload icon in center
  - "Drag & drop files or click to browse" text
  - Accepted formats: .pdf, .docx, .txt, .md
  - Hover: border color changes, slight scale
- **Selected Files List** (below drop zone):
  - Each file: filename, size badge, move up/down buttons, delete (X) button
- **Start Ingestion Button** (indigo, full-width, bottom)

### Step 2: Analyzing
- **Full-screen loading state**:
  - Large spinner animation
  - "Analyzing Manuscript..." text
  - Description: "Extracting characters, timeline, conflicts, and story structure..."

### Step 3: Review Extracted Data
- **Editable sections** (vertical stack of collapsible cards):
  1. **Project Metadata**: Title input, Genre input (comma-separated tags), Summary textarea
  2. **Chapters Detected**: Scrollable list — each: title input (editable), summary preview, delete button
  3. **Characters Extracted**: Each: name + role inputs (editable), description preview, current state (if detected), delete button
  4. **Conflicts & Plot Points**: Each: type label + description, delete button
  5. **World & Timeline**: Lore rules + timeline events, delete button per item
  6. **Story Elements**: Themes, Locations, Open Loops, Foreshadowing — shown as colored badge chips, deletable
  7. **Canon & Ambiguities**: Canon items + ambiguity items with confidence badges, deletable
- **Action Bar** (bottom, sticky):
  - "Cancel" button (neutral)
  - "Merge into Project Memory" button (indigo) — merges all reviewed data into store

### Step 4: Success
- Large checkmark icon (emerald)
- "Data imported successfully!" text
- "Import More Files" button

---

## Page 11: Writing Map (`/writing-map`)

**Purpose**: Analytics dashboard showing writing patterns and session history.

**Layout**: Single column with 4 distinct sections.

**Header**: "Writing Map" title + summary stats (total sessions count, total words count)

**Section 1: Activity Heatmap**
- GitHub-style contribution heatmap (52 weeks x 7 days = 365 cells)
- Color intensity: zinc-800 (no activity) → indigo-200 (light) → indigo-400 → indigo-500 → indigo-600 (heavy)
- Month labels across top
- Day labels on left (Mon, Wed, Fri)
- Tooltip on hover: date, words written, session count, average flow score (emoji), writing duration
- Legend bar at bottom: "Less" → gradient boxes → "More"

**Section 2: Words by Hour**
- Bar chart (24 bars, one per hour of day)
- Y-axis: average words per session
- X-axis: hours (12am, 1am, ... 11pm)
- Top 3 most productive hours highlighted in green
- Tooltip: session count + avg words for that hour
- Empty state: "Not enough data yet"

**Section 3: Insight Card**
- Single card with lightbulb icon (amber)
- Auto-generated one-liner about writing patterns
  - e.g., "Your secret hour: You write 45% more between 10PM-11PM"
  - Shows night owl / early bird badges
- Empty state (< 5 sessions): "Keep writing to unlock insights!"

**Section 4: Recent Sessions Table**
- Sortable table, last 20 sessions
- **Columns**: Project name, Date (formatted: "Jan 1, 2025"), Time ("10:30 AM"), Words (right-aligned number), Duration ("1h 23m"), Flow (emoji)
- **Sort**: Click column headers to sort (chevron icon shows direction)
- **Flow emojis**: terrible / rough / okay / good / amazing
- **Empty state**: "No writing sessions recorded yet."

---

## Page 12: Settings (`/settings`)

**Purpose**: App configuration, export/import, personas, danger zone.

**Layout**: Single column, max-width ~800px. Sections with clear visual separation.

**Section 1: Project Language**
- Label: "Language"
- Dropdown: English, Spanish, French, Portuguese, German, Italian, Japanese, Korean, Chinese, Russian, Arabic
- Helper text: "Affects AI analysis, ingestion, and assistant responses"

**Section 2: Alter Egos (Heteronyms)**
- Renders the heteronyms/persona management UI
- **List of personas** (up to 10):
  - Each row: Avatar circle (emoji on colored background) + Name + Bio snippet + Style note
  - "Default" badge on system default persona
  - "Active" badge on currently selected persona
  - Edit (pencil) / Delete (trash) buttons per row
- **"+ New" button** (disabled if at 10/10 limit)
- **Count**: "X/10 alter egos"
- **Create/Edit Modal**:
  - Name input
  - Bio textarea
  - Style note textarea
  - Avatar: Emoji grid picker (click to select) + Color swatch row (8-10 color options)
  - Live preview of avatar circle
  - Save / Cancel buttons

**Section 3: Export Project**
- "Export" button (indigo)
- Downloads entire story state as `.json` file
- Filename: `{story_title}_story_bible.json`

**Section 4: Restore Project**
- File input (accepts .json)
- Validates structure on upload
- Shows confirmation dialog before overwriting
- Creates backup in localStorage before import

**Section 5: Danger Zone** (red border, red-tinted background)
- "Clear All Data" button (red)
- Confirmation dialog: warns about irreversibility
- Clears all localStorage and reloads the page

---

## Error & Not Found Pages

**Error Page** (`/error`):
- Centered content
- AlertTriangle icon (red)
- "Something went wrong" heading
- Error message text
- "Try Again" button (resets error boundary)

**404 Page** (`/*` catch-all):
- Centered content
- Large "404" number
- "Page not found" text
- "Go to Dashboard" link button

---

## Component Inventory (for design reference)

| Component | Where Used | Visual Type |
|-----------|-----------|-------------|
| Sidebar | Global shell | Fixed nav panel |
| Toast | Everywhere | Bottom-right notification stack |
| Confirm Dialog | Everywhere | Centered modal with backdrop |
| Canon Status Badge | Manuscript, Characters, Timeline, Conflicts, Canon | Colored pill (emerald/blue/amber/red) |
| Avatar Circle | Flow, Settings, Heteronyms | Emoji on colored circle |
| Momentum Glow | Flow editor | Radial background animation |
| Calendar Heatmap | Writing Map | SVG grid of colored cells |
| Bar Chart | Writing Map | Vertical bar chart |
| Structured Response | Assistant | Multi-section card with collapsibles |
| Audit Results Modal | Assistant | Card overlay with risk cards |
| Breathing Guide | Ritual overlay | Animated pulsing circle |
| Ambient Particles | Ritual overlay | Canvas-based floating dots |
| Draggable File Zone | Import | Dashed-border drop target |
