# Design System: CoBrain Mobile

**Version**: 1.0.0
**Last Updated**: 2026-02-05

---

## Color Palette

### Primary Colors (matching web app)
```css
--primary: #2563eb      /* Blue-600 - CTAs, primary actions */
--primary-hover: #1d4ed8 /* Blue-700 - Hover states */
--success: #10b981      /* Green - Success states */
--warning: #f59e0b      /* Amber - Warnings */
--error: #ef4444        /* Red - Errors */
```

### Neutral Colors
```css
/* Light Mode */
--background: #ffffff
--surface: #f9fafb      /* Gray-50 */
--surface-secondary: #f3f4f6  /* Gray-100 */
--border: #e5e7eb       /* Gray-200 */
--text: #111827         /* Gray-900 */
--text-secondary: #6b7280  /* Gray-500 */

/* Dark Mode */
--background-dark: #0f172a  /* Slate-900 */
--surface-dark: #1e293b     /* Slate-800 */
--border-dark: #334155      /* Slate-700 */
--text-dark: #f8fafc        /* Slate-50 */
--text-secondary-dark: #94a3b8  /* Slate-400 */
```

---

## Typography

### Font Family
- **Primary**: System fonts (San Francisco on iOS, Roboto on Android)
- **Monospace**: Platform monospace for code

### Type Scale (NativeWind)
```javascript
fontSize: {
  'xs': 12,    // Captions, hints
  'sm': 14,    // Secondary text
  'base': 16,  // Body text
  'lg': 18,    // Emphasized text
  'xl': 20,    // Section headers
  '2xl': 24,   // Page titles
  '3xl': 30,   // Large headings
}
```

---

## Spacing System

```javascript
spacing: {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '10': 40,
  '12': 48,
}
```

---

## Components

### 1. Floating Action Button (FAB)
- Size: 56x56dp
- Position: Bottom-right, 16dp margin
- Shadow: elevation-5
- Icon: 24x24dp
- Animation: Scale on press (0.95)

### 2. Chat Message Bubble
- Max-width: 80% of screen
- Border radius: 16dp
- Padding: 12dp horizontal, 8dp vertical
- User messages: Primary color background
- AI messages: Surface background

### 3. Note Card
- Border radius: 12dp
- Padding: 16dp
- Shadow: elevation-1
- Active state: Primary border

### 4. Input Fields
- Height: 48dp (touch-friendly)
- Border radius: 12dp
- Border: 1dp solid border color
- Focus: Primary border, 2dp

### 5. Voice Input Button
- Size: 64x64dp when recording
- Pulse animation when active
- Red color when recording

---

## Touch Targets

All interactive elements must have minimum 44x44dp touch target.

---

## Safe Areas

Always respect:
- iOS notch/Dynamic Island
- Android status bar
- Bottom navigation bar
- Keyboard avoidance

---

## Animations

### Transitions
- Duration: 200ms (fast), 300ms (normal)
- Easing: ease-in-out

### Micro-interactions
- Button press: Scale 0.95
- FAB press: Scale 0.9
- Card tap: Opacity 0.7
- Success: Checkmark fade-in

---

## Screen Layouts

### 1. Home/Capture Screen
```
┌─────────────────────────────┐
│ ≡  CoBrain           [🔔]  │ ← Header
├─────────────────────────────┤
│                             │
│  ┌─────────────────────┐    │
│  │ "What's on your     │    │ ← Quick capture
│  │  mind?"             │    │
│  │                     │    │
│  │ [🎤]           [✓] │    │
│  └─────────────────────┘    │
│                             │
│  Recent Notes               │
│  ┌───────────────────────┐  │
│  │ Note preview...       │  │
│  └───────────────────────┘  │
│  ┌───────────────────────┐  │
│  │ Note preview...       │  │
│  └───────────────────────┘  │
│                             │
├─────────────────────────────┤
│ 🏠  💬  📝  ⚙️            │ ← Bottom nav
└─────────────────────────────┘
```

### 2. Chat Screen
```
┌─────────────────────────────┐
│ ←  Chat with CoBrain        │
├─────────────────────────────┤
│                             │
│  ┌──────────────────┐       │
│  │ User message     │       │
│  └──────────────────┘       │
│       ┌──────────────────┐  │
│       │ AI response      │  │
│       │ with source refs │  │
│       └──────────────────┘  │
│                             │
│  ┌──────────────────┐       │
│  │ Follow-up        │       │
│  └──────────────────┘       │
│                             │
├─────────────────────────────┤
│ [    Type a message   ] [🎤]│
└─────────────────────────────┘
```

### 3. Notes List Screen
```
┌─────────────────────────────┐
│ ←  Notes          [🔍] [+] │
├─────────────────────────────┤
│ [Search notes...]           │
├─────────────────────────────┤
│ Today                       │
│ ┌───────────────────────┐   │
│ │ Meeting notes with... │   │
│ │ 10:30 AM              │   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ Shopping list...      │   │
│ │ 9:15 AM               │   │
│ └───────────────────────┘   │
│ Yesterday                   │
│ ┌───────────────────────┐   │
│ │ Project ideas...      │   │
│ │ 4:20 PM               │   │
│ └───────────────────────┘   │
│                             │
└─────────────────────────────┘
```

---

## Accessibility

### WCAG AA Compliance
- Color contrast ratio >= 4.5:1 for text
- Focus indicators visible
- Screen reader support (accessibilityLabel)
- Haptic feedback for important actions

### Reduced Motion
- Respect `prefers-reduced-motion`
- Provide alternative for animations

---

## Platform-Specific Guidelines

### iOS
- Use SF Symbols for icons
- Respect Dynamic Type
- Support haptic feedback (UIImpactFeedbackGenerator)

### Android
- Use Material Design icons
- Support back button navigation
- Respect font scaling

---

**End of Design System**
