# Codebase Agent Rules & Guidelines

## Architecture Overview
- **Next.js (App Router)**: Single page interface (`app/page.tsx`).
- **Server Side**: Gemini calls are confined to server-side endpoints (`app/api/gemini/route.ts`).
- **State Management**: Clean interactive state holding layer bounds, colors, selections, view scales, and presets.

## Component Boundaries
- Keep UI in `/components/card-builder` or inside single cohesive components to avoid context splitting.
- All SVG icons should be imported from `lucide-react`. Do not write raw inline SVGs for standard control buttons.

## Style Enforcement
- **Tailwind Only**: Handle styles using standard utility classes. No custom CSS declarations outside global setup.
- **Accents**: Maintain clean off-white high contrast palettes.
