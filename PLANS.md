# Applet Implementation Plans

## Draft 1: Dynamic High-Resolution Business Card Builder [PENDING APPROVAL]

### 1. Unified Workspace Canvas
- Set up an HTML5 Canvas or SVG-based viewport containing:
  - Outer bounds (incorporates bleed padding).
  - Main standard business card trim edge.
  - Safe margin border (ensures critical content resides far enough from the edge).
- Implement responsive mouse/touch listeners to drag, resize from corners, and rotate layers inside the viewport.

### 2. Properties Control Board
- Add sidebar editors targeting:
  - Text: Size, alignment, style, font-weight, tracking.
  - Images: Scale, opacity, rotation, image upload trigger, filter options.
  - SVG Items: Icon selection, custom stroke, fill colors.
  - General Layout: US Standard vs EU Standard, card background, card side (Face/Front vs Back).

### 3. CMYK & Printing Calibration
- Color Pickers displaying paired RGB and CMYK calculated values.
- CMYK editor: Fine-tune values for print compatibility (Cyan, Magenta, Yellow, Black inputs synced to HEX colors).

### 4. Advanced Crop Mark Prep
- Wrap the canvas wrapper inside an extended "Print Workspace" showing registration bars and offset target crop marks.
- Trigger browser `window.print()` using customized `@media print` rules to output pristine high-definition vectors (300DPI equivalent) with trim borders.

### 5. Gemini-Powered AI Content generator
- Build `/app/api/gemini/route.ts` using `@google/genai` to generate corporate text, content themes, or optimal color structures given a brief text prompt.
