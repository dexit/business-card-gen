# Feature Technical Specifications

## 1. Presets and Canvas Geometry
- **US Standard Dimensions**: 3.5" x 2.0" (1050px x 600px at 300 DPI).
- **EU/UK Dimensions**: 85mm x 55mm (1004px x 650px at 300 DPI).
- **Bleed Allowance**: 0.125 inches / 3.2mm (+36px total perimeter).
- **Safe Zone Offset**: 0.125 inches / 3.2mm (-36px inward perimeter).

## 2. Interactive SVG Editing Workspace
- Standard layers: `Text`, `Image`, `SVG Icon`, and `Background Rect`.
- Position controls: Drag, multi-direction resize, rotate (degrees), layer alignment tools.
- Depth sorting: Bring to Front, Send to Back, Move Up, Move Down.

## 3. Advanced Properties Controller
- **Fonts**: Dynamic styling using Inter (clean), Space Grotesk (tech), Playfair Display (serif), and JetBrains Mono (monospaced).
- **Colors**: Hex and CMYK (Cyan, Magenta, Yellow, Key/Black) dual-view controllers.
- **Image Filters**: Adjust scale, rotation, grayscale, opacity, brightness, and contrast.

## 4. Professional Export Engine
- **Crop Marks**: Precision offset crosshairs indicating physical cut coordinates.
- **Color Calibration Bars**: Printing industry standard target blocks to secure printer registration.
- **Printers Margin Prep**: Generates isolated high-res layout wrappers (ready to print gracefully from any browser).
