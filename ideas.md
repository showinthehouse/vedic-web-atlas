# Vedic Web Atlas 设计方向

## 三个方向探索

### Theme Name: Observatory Ledger
Very Brief Intro: A scholarly digital observatory that turns dense astrological computation into a calm, legible research instrument. It feels archival, exact, and quietly premium.
Probability: 0.07

### Theme Name: Ritual Interface
Very Brief Intro: A tactile, warm interface inspired by temple calendars, handwritten almanacs, and copper instruments. It makes technical astrology feel human and contemplative.
Probability: 0.03

### Theme Name: Signal Field
Very Brief Intro: A restrained dark interface where orbital paths and data traces create a sense of live calculation. It is focused and energetic without falling into cyberpunk styling.
Probability: 0.05

## Selected Direction: Observatory Ledger

### Design Movement
Contemporary editorialism mixed with scientific instrument design and South Asian astronomical archive references. The interface should feel like a digital reading room rather than a generic SaaS dashboard.

### Core Principles
1. Exactness before decoration: every interactive element should clarify the research scope or move the visitor toward trying the chart workspace.
2. Layered evidence: research conclusions, feature depth, technical constraints, and risk should appear as connected layers rather than a single marketing narrative.
3. Tactile restraint: use paper grain, thin rules, brass-like accents, and quiet shadows; avoid glossy cards and loud gradients.
4. Asymmetric calm: use split layouts, editorial columns, and offset panels to create rhythm without relying on centered hero blocks.

### Color Philosophy
Ink navy communicates precision and night-sky depth. Warm ivory keeps long-form research readable. Saffron gold marks action, insight, and the central solar symbol. Clay red is reserved for caution and legal/accuracy risks. The palette should feel like a preserved atlas with a modern interface layered on top.

### Layout Paradigm
A two-column editorial workspace: a sticky left rail for context and navigation, a broad content canvas for the research story, and a right-side interactive chart preview that periodically breaks the grid. Use horizontal rules and section markers as navigational anchors.

### Signature Elements
1. Orbital rule: a thin concentric orbit graphic used as a decorative framing device and as the visual metaphor for calculation layers.
2. Evidence tags: small uppercase labels such as ENGINE, METHOD, RISK, and NEXT used to scan sections quickly.
3. Chart specimen: a stylized SVG chart preview with a live-selected house highlight.

### Interaction Philosophy
Interactions should feel like adjusting a precision instrument: a small, immediate visual response, clear selected states, and no theatrical motion. Buttons use a short press scale, panels reveal with a slight upward drift, and charts highlight connected data rather than simply changing color.

### Animation
Use 180–260ms ease-out transitions for nav states, tabs, and hover cards. Reveal sections with a low-distance translateY and opacity only when motion is allowed. On the chart specimen, highlight the selected house with a 220ms stroke and fill transition. Never animate layout dimensions. Respect prefers-reduced-motion.

### Typography System
Display: Fraunces, italic or semi-bold for high-level editorial titles. Body: IBM Plex Sans for dense interface text. Labels: IBM Plex Mono, uppercase, tight tracking. Use large serif headlines against short sans-serif explanatory copy, with mono labels for evidence and status.

### Brand Essence
A research-first web atlas for Vedic astrologers who need to compare methods, validate calculations, and work across devices without losing technical depth. Personality: exact, contemplative, generous.

### Brand Voice
Headlines sound like an invitation to investigate, not a generic SaaS promise. CTAs are specific and action-oriented. Microcopy explains what is known, what is provisional, and what needs validation.

Example lines:
- "See the engine beneath the chart."
- "Compare methods before you trust the result."

### Wordmark & Logo
Use the generated symbol: a saffron sun inside four orbit rings with a diamond star grid. Pair it with a custom text lockup set in Fraunces, but keep the symbol independent so it can serve as the favicon and the persistent workspace marker.

### Signature Brand Color
Solar Saffron #C9893E — a muted brass-saffron that reads as warmth, evidence, and a precise point of focus against ink navy.

## Style Decisions
- Use generated assets only in visually prominent sections; keep supporting visuals in CSS and SVG.
- Never use a purple gradient, generic dashboard card grid, or excessive rounded rectangles.
- The landing page should feel like an editorial research instrument, not a horoscope entertainment site.
- Content must clearly distinguish the interactive prototype from a production-grade astronomical calculator.
