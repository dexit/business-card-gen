"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Layout, 
  FolderDown, 
  Sparkle, 
  FileText, 
  Image as ImageIcon, 
  Type as TypeIcon, 
  MoveUp, 
  MoveDown, 
  CornerDownRight, 
  RefreshCw, 
  Eye, 
  Sliders, 
  Layers, 
  Minimize2, 
  Maximize2, 
  Check, 
  Printer, 
  Scissors, 
  Ruler, 
  Paintbrush, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Sparkle as SparkleIcon,
  Palette,
  FileCode,
  CornerUpLeft,
  RotateCw,
  Undo2,
  ChevronDown,
  Save,
  Copy,
  Upload,
  Download,
  FileJson,
  Bold,
  Italic,
  GripVertical,
  Brush,
  Hexagon,
  Star
} from "lucide-react";

// Standard Types
interface CardLayer {
  id: string;
  type: "text" | "image" | "shape" | "custom-svg" | "icon";
  text?: string;
  imageUrl?: string;
  shapeType?: "rect" | "circle" | "line" | "logo-badge" | "triangle" | "star" | "hexagon" | "pentagon" | "ellipse" | "path";
  customSvgString?: string;
  pathData?: string;
  iconName?: string;
  iconFill?: boolean;
  gradientType?: "none" | "linear" | "radial";
  gradientStartColor?: string;
  gradientEndColor?: string;
  gradientAngle?: number;
  xMm: number; // coordinates relative to actual trim size (0,0 is start of 85x55mm)
  yMm: number;
  widthMm: number;
  heightMm: number;
  fontSizeMm?: number;
  fontWeight?: string;
  fontFamily?: string;
  fontStyle?: "normal" | "italic";
  colorHex: string;
  textAlign?: "left" | "center" | "right";
  letterSpacingMm?: number;
  rotation: number; // degrees
  opacity: number;
  autoFitText?: boolean;
  strokeColor?: string;
  strokeWidthMm?: number;
}

interface CardSides {
  front: CardLayer[];
  back: CardLayer[];
}

interface PresetPreset {
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
}

const PRESETS: Record<string, PresetPreset> = {
  eu: { name: "EU Standard", widthMm: 85, heightMm: 55, description: "Popular in UK, Europe & Commonwealth (3.35\" × 2.17\")" },
  us: { name: "US Standard", widthMm: 88.9, heightMm: 50.8, description: "Standard US size (3.5\" × 2.0\")" },
};

// CMYK calculation helper
function hexToCmyk(hex: string) {
  let r = parseInt(hex.replace("#", "").substring(0, 2), 16) / 255;
  let g = parseInt(hex.replace("#", "").substring(2, 4), 16) / 255;
  let b = parseInt(hex.replace("#", "").substring(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  let k = 1 - Math.max(r, g, b);
  if (k === 1) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }

  let c = Math.round(((1 - r - k) / (1 - k)) * 100);
  let m = Math.round(((1 - g - k) / (1 - k)) * 100);
  let y = Math.round(((1 - b - k) / (1 - k)) * 100);
  let kPercent = Math.round(k * 100);

  return { c, m, y, k: kPercent };
}

// CMYK to HEX helper for sliders
function cmykToHex(c: number, m: number, y: number, k: number) {
  const cDecimal = c / 100;
  const mDecimal = m / 100;
  const yDecimal = y / 100;
  const kDecimal = k / 100;

  const r = Math.round(255 * (1 - cDecimal) * (1 - kDecimal));
  const g = Math.round(255 * (1 - mDecimal) * (1 - kDecimal));
  const b = Math.round(255 * (1 - yDecimal) * (1 - kDecimal));

  const hexPart = (val: number) => {
    const str = Math.max(0, Math.min(255, val)).toString(16);
    return str.length === 1 ? "0" + str : str;
  };

  return `#${hexPart(r)}${hexPart(g)}${hexPart(b)}`.toUpperCase();
}

// Curated high-fidelity SVG icon coordinate paths (24x24 scale)
const SVG_ICONS: Record<string, string> = {
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  mail: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7 M2 4h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  map_pin: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  globe: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
  share2: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3.5 20.5l1.4-5.2a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
  briefcase: "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16 M22 6H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2z",
  award: "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M8.21 13.89 7 23l5-3 5 3-1.21-9.12",
  building: "M3 21h18 M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16 M9 9h0 M15 9h0 M9 13h0 M15 13h0 M9 17h0 M15 17h0",
  slack: "M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z M16 4.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5S18.33 6 17.5 6H16V4.5z M10 9.5C10 8.67 9.33 8 8.5 8v5H10V9.5z M8.5 16H4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5h4v1.5c0 .83-.67 1.5-1.5 1.5z M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5z M8 19.5c0 .83-.67 1.5-1.5 1.5S5 20.33 5 19.5 5.67 18 6.5 18H8v1.5z M14 14.5c0 .83.67 1.5 1.5 1.5h4c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5h-4v1.5z M15.5 8H19.5c.83 0 1.5.67 1.5 1.5S20.33 11 19.5 11h-4V9.5c0-.83.67-1.5 1.5-1.5z",
  instagram: "M17 2H7a5 5 0 0 0-5 5v10a5 5 0 0 0 5 5h10a5 5 0 0 0 5-5V7a5 5 0 0 0-5-5z M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01",
  linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-9 M2 9h4v12H2z M4 2a2 2 0 1 1-2-2 2 2 0 0 1 2 2z",
  twitter: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
  github: "M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22",
  facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  sparkles: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",
  heart: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
  trophy: "M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34 M12 2a4 4 0 0 1 4 4v5a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  credit_card: "M21 4H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M1 10h22",
  company: "M2 22h20 M17 18H7v4h10 M12 2v4 M12 10v4 M7 2h10a2 2 0 0 1 2 2v18H5V4a2 2 0 0 1 2-2z"
};

// SVG custom vector path parser & builder helpers
function parsePathPoints(d: string): { x: number; y: number }[] {
  if (!d) return [];
  const points: { x: number; y: number }[] = [];
  const regex = /([ML])\s*([\d.-]+)\s*([\d.-]+)/gi;
  let match;
  while ((match = regex.exec(d)) !== null) {
    points.push({
      x: parseFloat(match[2]),
      y: parseFloat(match[3]),
    });
  }
  return points;
}

function buildPathData(points: { x: number; y: number }[], closed: boolean): string {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  if (closed) {
    d += " Z";
  }
  return d;
}

// Cache of canvas context for high-precision text measuring
let measurementContext: CanvasRenderingContext2D | null = null;

function getTextWidth100(text: string, fontStyle: string, fontWeight: string, fontFamily: string): number {
  if (typeof window === "undefined" || !text) return 0;
  try {
    if (!measurementContext) {
      const canvas = document.createElement("canvas");
      measurementContext = canvas.getContext("2d");
    }
    if (!measurementContext) return 0;
    measurementContext.font = `${fontStyle || "normal"} ${fontWeight || "normal"} 100px ${fontFamily || "Outfit"}, "Segoe UI", sans-serif`;
    return measurementContext.measureText(text).width;
  } catch (e) {
    return text.length * 52; // simple fallback
  }
}

function getRenderFontSizeMm(l: CardLayer): number {
  let renderFontSizeMm = l.fontSizeMm || 3;
  if (l.autoFitText && l.text) {
    const wPx100 = getTextWidth100(l.text || "", l.fontStyle || "normal", l.fontWeight || "normal", l.fontFamily || "Outfit");
    if (wPx100 > 0) {
      const letterSpacingMmTotal = (l.text ? l.text.length - 1 : 0) * (l.letterSpacingMm || 0);
      const targetWidth = l.widthMm - letterSpacingMmTotal;
      if (targetWidth > 0) {
        const fitFontSizeMm = (targetWidth / wPx100) * 100;
        if (fitFontSizeMm < renderFontSizeMm) {
          renderFontSizeMm = Math.max(0.6, fitFontSizeMm);
        }
      }
    }
  }
  return renderFontSizeMm;
}

/**
 * Generates component-safe unique IDs outside of react-hooks render scoping
 */
function generateUniqueId(prefix: string): string {
  const randNum = Math.floor(Math.random() * 10000000);
  return `${prefix}-${randNum}`;
}

export default function BusinessCardStudio() {
  // Preset Selection
  const [selectedPreset, setSelectedPreset] = useState<"eu" | "us">("eu");
  const { widthMm, heightMm } = PRESETS[selectedPreset];

  // Global variables
  const bleedDistanceMm = 3; // 3mm bleed margin
  const safeZoneMarginMm = 3; // 3mm safe boundary inward

  // Side choice
  const [currentSide, setCurrentSide] = useState<"front" | "back">("front");

  // Card Layers Source State
  const [layers, setLayers] = useState<CardSides>({
    front: [
      {
        id: "logo-crest",
        type: "shape",
        shapeType: "logo-badge",
        xMm: 12,
        yMm: 12,
        widthMm: 12,
        heightMm: 12,
        colorHex: "#1E293B",
        rotation: 0,
        opacity: 1,
      },
      {
        id: "brand-name",
        type: "text",
        text: "METRIC CORP",
        xMm: 27,
        yMm: 16,
        widthMm: 50,
        heightMm: 6,
        fontSizeMm: 4.2,
        fontWeight: "bold",
        fontFamily: "Space Grotesk",
        colorHex: "#1E293B",
        textAlign: "left",
        letterSpacingMm: 0.6,
        rotation: 0,
        opacity: 1,
      },
      {
        id: "brand-sub",
        type: "text",
        text: "Precision Engineering",
        xMm: 27,
        yMm: 21,
        widthMm: 45,
        heightMm: 4,
        fontSizeMm: 2.2,
        fontWeight: "medium",
        fontFamily: "Inter",
        colorHex: "#64748B",
        textAlign: "left",
        letterSpacingMm: 0.2,
        rotation: 0,
        opacity: 0.9,
      },
      {
        id: "owner-name",
        type: "text",
        text: "Sarah Vance",
        xMm: 12,
        yMm: 33,
        widthMm: 60,
        heightMm: 6,
        fontSizeMm: 4.8,
        fontWeight: "bold",
        fontFamily: "Outfit",
        colorHex: "#0F172A",
        textAlign: "left",
        letterSpacingMm: 0.1,
        rotation: 0,
        opacity: 1,
      },
      {
        id: "owner-title",
        type: "text",
        text: "CHIEF METROLOGY OFFICER",
        xMm: 12,
        yMm: 38,
        widthMm: 60,
        heightMm: 4,
        fontSizeMm: 2.1,
        fontWeight: "bold",
        fontFamily: "JetBrains Mono",
        colorHex: "#9A3412",
        textAlign: "left",
        letterSpacingMm: 0.4,
        rotation: 0,
        opacity: 1,
      },
      {
        id: "contact-phone",
        type: "text",
        text: "T: +44 (0) 20 8943 6800",
        xMm: 12,
        yMm: 45,
        widthMm: 60,
        heightMm: 3,
        fontSizeMm: 2.2,
        fontWeight: "normal",
        fontFamily: "Inter",
        colorHex: "#475569",
        textAlign: "left",
        letterSpacingMm: 0,
        rotation: 0,
        opacity: 1,
      },
      {
        id: "contact-email",
        type: "text",
        text: "E: s.vance@metric-corp.eu",
        xMm: 12,
        yMm: 48.5,
        widthMm: 60,
        heightMm: 3,
        fontSizeMm: 2.2,
        fontWeight: "normal",
        fontFamily: "Inter",
        colorHex: "#475569",
        textAlign: "left",
        letterSpacingMm: 0,
        rotation: 0,
        opacity: 1,
      }
    ],
    back: [
      {
        id: "bg-shape",
        type: "shape",
        shapeType: "rect",
        xMm: 0,
        yMm: 0,
        widthMm: 85,
        heightMm: 55,
        colorHex: "#1E293B",
        rotation: 0,
        opacity: 1,
      },
      {
        id: "back-logo",
        type: "shape",
        shapeType: "logo-badge",
        xMm: 36,
        yMm: 15,
        widthMm: 14,
        heightMm: 14,
        colorHex: "#F97316",
        rotation: 45,
        opacity: 1,
      },
      {
        id: "back-title",
        type: "text",
        text: "METRIC CORP",
        xMm: 10,
        yMm: 34,
        widthMm: 65,
        heightMm: 8,
        fontSizeMm: 5.5,
        fontWeight: "bold",
        fontFamily: "Space Grotesk",
        colorHex: "#F8FAFC",
        textAlign: "center",
        letterSpacingMm: 0.8,
        rotation: 0,
        opacity: 1,
      },
      {
        id: "back-slogan",
        type: "text",
        text: "MEASURING PROGRESS SINCE 1984",
        xMm: 10,
        yMm: 41,
        widthMm: 65,
        heightMm: 4,
        fontSizeMm: 2.0,
        fontWeight: "medium",
        fontFamily: "JetBrains Mono",
        colorHex: "#94A3B8",
        textAlign: "center",
        letterSpacingMm: 0.5,
        rotation: 0,
        opacity: 0.9,
      }
    ]
  });

  // Undo/Redo tracking
  const [history, setHistory] = useState<CardSides[]>([]);

  const pushStateToHistory = (newSides: CardSides) => {
    setHistory((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(layers))]);
    setLayers(newSides);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setLayers(previous);
  };

  // Selected Layer
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("owner-name");

  // Modern enhanced custom state variables
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  
  // Custom enhanced select boxes lists opens
  const [fontDropdownOpen, setFontDropdownOpen] = useState<boolean>(false);
  const [weightDropdownOpen, setWeightDropdownOpen] = useState<boolean>(false);
  const [floatingFontDropdownOpen, setFloatingFontDropdownOpen] = useState<boolean>(false);

  // States for Quick Action Toolbar dragging & placement offset
  const [toolbarOffset, setToolbarOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState<boolean>(false);
  const toolbarDragStartRef = useRef<{ clientX: number, clientY: number, startX: number, startY: number } | null>(null);
  
  // Custom high contrast context menu controls
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    layerId: string | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    layerId: null,
  });

  // LocalStorage designs catalog
  const [savedDesigns, setSavedDesigns] = useState<Array<{
    id: string;
    name: string;
    preset: "eu" | "us";
    sides: CardSides;
    timestamp: string;
  }>>([]);
  const [newDesignName, setNewDesignName] = useState<string>("");

  // Grid / File drag drops overriding highlight
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Inspector layout tab choice
  const [activeTab, setActiveTab] = useState<"workspace" | "code" | "gallery">("workspace");

  // Style Toggles
  const [roundedCorners, setRoundedCorners] = useState<boolean>(true);
  const [showBleedGuides, setShowBleedGuides] = useState<boolean>(true);
  const [showSafeGuides, setShowSafeGuides] = useState<boolean>(true);
  const [snapToGuides, setSnapToGuides] = useState<boolean>(true);

  // Sidebars Toggle State
  const [leftMinimised, setLeftMinimised] = useState<boolean>(false);
  const [rightMinimised, setRightMinimised] = useState<boolean>(false);

  // Zoom slider state
  const [zoomFactor, setZoomFactor] = useState<number>(7.2); // translates 1mm to X pixels

  // Dynamic alignment snaps coordinates during drags
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }>({});

  // Prompt generation
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [businessType, setBusinessType] = useState<string>("Premium Luxury");
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Drag states
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [originalLayerRect, setOriginalLayerRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Path drawing and custom vector states
  const [isDrawingPathMode, setIsDrawingPathMode] = useState<boolean>(false);
  const [drawingPathPoints, setDrawingPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [editingPathPointsLayerId, setEditingPathPointsLayerId] = useState<string | null>(null);
  
  // Icon Insert States
  const [isIconPickerOpen, setIsIconPickerOpen] = useState<boolean>(false);

  // Image Upload helper
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active side layer listing
  const currentLayers = layers[currentSide];

  // Helper setter for current active layers
  const updateCurrentLayers = (updater: (prev: CardLayer[]) => CardLayer[]) => {
    const updated = updater(currentLayers);
    const newSides = {
      ...layers,
      [currentSide]: updated
    };
    pushStateToHistory(newSides);
  };

  const selectedLayer = currentLayers.find(l => l.id === selectedLayerId);

  // Delete handler
  const handleDeleteLayer = (id: string) => {
    updateCurrentLayers(prev => prev.filter(l => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Keyboard Delete / Backspace and Arrow Key movement logic
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is focused on interactive inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable ||
        editingTextId !== null
      ) {
        return;
      }

      if (!selectedLayerId || !selectedLayer) return;

      // Nudge Step helper
      const step = e.shiftKey ? 2.0 : 0.5;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteLayer(selectedLayerId);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        updateCurrentLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, yMm: parseFloat(Math.max(-10, l.yMm - step).toFixed(2)) } : l));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        updateCurrentLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, yMm: parseFloat(Math.min(heightMm + 10, l.yMm + step).toFixed(2)) } : l));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        updateCurrentLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, xMm: parseFloat(Math.max(-10, l.xMm - step).toFixed(2)) } : l));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        updateCurrentLayers(prev => prev.map(l => l.id === selectedLayerId ? { ...l, xMm: parseFloat(Math.min(widthMm + 10, l.xMm + step).toFixed(2)) } : l));
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [selectedLayerId, selectedLayer, currentSide, layers, editingTextId, heightMm, widthMm]);

  // Load saved layouts from browser LocalStorage on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const cached = localStorage.getItem("metric_studio_saved_designs");
      if (cached) {
        try {
          setSavedDesigns(JSON.parse(cached));
        } catch (e) {
          console.warn("Could not read saved designs database from LocalStorage", e);
        }
      }

      // Try to load any autosaved current state representing progress
      const auto = localStorage.getItem("metric_studio_autosave_state");
      if (auto) {
        try {
          const parsed = JSON.parse(auto);
          if (parsed.layers) {
            setLayers(parsed.layers);
            if (parsed.selectedPreset) {
              setSelectedPreset(parsed.selectedPreset);
            }
          }
        } catch (e) {
          console.log("No previous autosave loaded.");
        }
      }
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Autosave work progress upon layer structure changes
  useEffect(() => {
    localStorage.setItem("metric_studio_autosave_state", JSON.stringify({
      layers,
      selectedPreset
    }));
  }, [layers, selectedPreset]);

  // Dismiss context menu trigger upon clicking anywhere
  useEffect(() => {
    const dismissMenu = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener("click", dismissMenu);
    return () => {
      window.removeEventListener("click", dismissMenu);
    };
  }, [contextMenu.visible]);

  // Handle global mouse pointer dragging for Quick Toolbar
  useEffect(() => {
    if (!isDraggingToolbar) return;

    const handlePointerMoveGlobal = (e: PointerEvent) => {
      if (!toolbarDragStartRef.current) return;
      const dx = e.clientX - toolbarDragStartRef.current.clientX;
      const dy = e.clientY - toolbarDragStartRef.current.clientY;
      setToolbarOffset({
        x: toolbarDragStartRef.current.startX + dx,
        y: toolbarDragStartRef.current.startY + dy
      });
    };

    const handlePointerUpGlobal = () => {
      setIsDraggingToolbar(false);
      toolbarDragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMoveGlobal);
    window.addEventListener("pointerup", handlePointerUpGlobal);
    return () => {
      window.removeEventListener("pointermove", handlePointerMoveGlobal);
      window.removeEventListener("pointerup", handlePointerUpGlobal);
    };
  }, [isDraggingToolbar]);

  // Reset toolbar position offset whenever active layer changes asynchronously
  useEffect(() => {
    const handle = setTimeout(() => {
      setToolbarOffset({ x: 0, y: 0 });
    }, 0);
    return () => clearTimeout(handle);
  }, [selectedLayerId]);

  // Duplicate active layer helper
  const handleDuplicateLayer = (layerId: string) => {
    const toDuplicate = currentLayers.find(l => l.id === layerId);
    if (!toDuplicate) return;
    const newId = generateUniqueId(`${toDuplicate.id}-copy`);
    const duplicated: CardLayer = {
      ...JSON.parse(JSON.stringify(toDuplicate)),
      id: newId,
      xMm: Math.min(widthMm - 10, toDuplicate.xMm + 4),
      yMm: Math.min(heightMm - 10, toDuplicate.yMm + 4)
    };
    updateCurrentLayers(prev => [...prev, duplicated]);
    setSelectedLayerId(newId);
  };

  // Add Custom Vector SVG Layer to canvas
  const addCustomSvgLayer = (rawSvgStr?: string) => {
    const id = generateUniqueId("layer-custom-svg");
    const newLayer: CardLayer = {
      id,
      type: "custom-svg",
      customSvgString: rawSvgStr || `<circle cx="6" cy="6" r="5" fill="#F59E0B" />`,
      xMm: Math.round(widthMm / 3),
      yMm: Math.round(heightMm / 3),
      widthMm: 12,
      heightMm: 12,
      colorHex: "#F59E0B",
      rotation: 0,
      opacity: 1
    };
    updateCurrentLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(id);
  };

  // Manage LocalStorage Manual Catalog Actions
  const handleSaveDesign = (customName?: string) => {
    const label = customName?.trim() || newDesignName.trim() || `My Studio Card #${savedDesigns.length + 1}`;
    const entry = {
      id: generateUniqueId("card-layout"),
      name: label,
      preset: selectedPreset,
      sides: JSON.parse(JSON.stringify(layers)),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " " + new Date().toLocaleDateString()
    };
    const updated = [entry, ...savedDesigns];
    setSavedDesigns(updated);
    localStorage.setItem("metric_studio_saved_designs", JSON.stringify(updated));
    setNewDesignName("");
  };

  const handleLoadDesign = (id: string) => {
    const target = savedDesigns.find(d => d.id === id);
    if (!target) return;
    pushStateToHistory(JSON.parse(JSON.stringify(layers)));
    setLayers(target.sides);
    setSelectedPreset(target.preset);
  };

  const handleDeleteSavedDesign = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem("metric_studio_saved_designs", JSON.stringify(updated));
  };

  // JSON Schema Export Project config
  const handleExportJson = () => {
    const fileContent = JSON.stringify({
      format: "METRIC_STUDIO_JSON_TEMPLATE",
      preset: selectedPreset,
      layers: layers
    }, null, 2);
    const blob = new Blob([fileContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MetricStudio-Design-${selectedPreset}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // JSON Schema Import Project config
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.layers) {
          pushStateToHistory(JSON.parse(JSON.stringify(layers)));
          setLayers(parsed.layers);
          if (parsed.preset === "us" || parsed.preset === "eu") {
            setSelectedPreset(parsed.preset);
          }
        } else {
          setAiError("Invalid project configuration format.");
        }
      } catch (err) {
        setAiError("Failed to parse the template JSON.");
      }
    };
    reader.readAsText(file);
  };

  // Drag and drop layer image files onto workspace canvas
  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/") && !file.name.endsWith(".svg")) {
      setAiError("Dropped file must be an image (PNG, WebP, SVG, JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const id = generateUniqueId("layer-img-drop");
      
      const newLayer: CardLayer = {
        id,
        type: "image",
        imageUrl: url,
        xMm: Math.round(widthMm / 4),
        yMm: Math.round(heightMm / 4),
        widthMm: 25,
        heightMm: 25,
        rotation: 0,
        opacity: 1,
        colorHex: "#1E293B"
      };

      updateCurrentLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(id);
    };
    reader.readAsDataURL(file);
  };

  // Move Z-Index index layers
  const moveZIndex = (direction: "up" | "down", id: string) => {
    const index = currentLayers.findIndex(l => l.id === id);
    if (index === -1) return;
    const newArr = [...currentLayers];
    if (direction === "up" && index < newArr.length - 1) {
      const temp = newArr[index];
      newArr[index] = newArr[index + 1];
      newArr[index + 1] = temp;
    } else if (direction === "down" && index > 0) {
      const temp = newArr[index];
      newArr[index] = newArr[index - 1];
      newArr[index - 1] = temp;
    }
    updateCurrentLayers(() => newArr);
  };

  // Add Dynamic Text Layer
  const addTextLayer = () => {
    const id = generateUniqueId("layer-text");
    const newLayer: CardLayer = {
      id,
      type: "text",
      text: "Double-click to edit text",
      xMm: Math.round(widthMm / 3),
      yMm: Math.round(heightMm / 2),
      widthMm: 45,
      heightMm: 6,
      fontSizeMm: 3.5,
      fontWeight: "medium",
      fontFamily: "Outfit",
      colorHex: "#1E293B",
      textAlign: "center",
      letterSpacingMm: 0.1,
      rotation: 0,
      opacity: 1,
    };
    updateCurrentLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(id);
  };

  // Add Shape Layer
  const addShapeLayer = (shapeType: CardLayer["shapeType"]) => {
    if (!shapeType) return;
    const id = generateUniqueId("layer-shape");
    
    // Default size and color values for different custom shapes
    let w = 15;
    let h = 15;
    let col = "#4b5563"; // slate grey default
    
    if (shapeType === "rect") {
      w = 20;
      h = 10;
    } else if (shapeType === "circle" || shapeType === "ellipse") {
      w = 12;
      h = 12;
    } else if (shapeType === "line") {
      w = 25;
      h = 3;
    } else if (shapeType === "logo-badge") {
      w = 12;
      h = 12;
      col = "#EA580C";
    }
    
    const newLayer: CardLayer = {
      id,
      type: "shape",
      shapeType,
      xMm: Math.round(widthMm / 3),
      yMm: Math.round(heightMm / 3),
      widthMm: w,
      heightMm: h,
      colorHex: col,
      rotation: 0,
      opacity: 1,
      strokeWidthMm: shapeType === "line" ? 0.8 : 0,
    };
    updateCurrentLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(id);
  };

  // Add Icon Layer
  const addIconLayer = (iconName: string) => {
    const id = generateUniqueId("layer-icon");
    const newLayer: CardLayer = {
      id,
      type: "icon",
      iconName,
      iconFill: false,
      xMm: Math.round(widthMm / 3),
      yMm: Math.round(heightMm / 3),
      widthMm: 8,
      heightMm: 8,
      colorHex: "#1e293b",
      rotation: 0,
      opacity: 1,
      strokeWidthMm: 0.8, // crisp line width for the Lucide stroke
    };
    updateCurrentLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(id);
  };

  // Convert hand-drawn path coordinates to a vector Layer
  const finishPathDrawing = (close: boolean = true) => {
    if (drawingPathPoints.length < 2) {
      setIsDrawingPathMode(false);
      setDrawingPathPoints([]);
      return;
    }
    
    const xs = drawingPathPoints.map(p => p.x);
    const ys = drawingPathPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const w = Math.max(1, maxX - minX);
    const h = Math.max(1, maxY - minY);
    
    // Normalize coordinates relative to the bounding box (0,0) of the layer,
    const relativePoints = drawingPathPoints.map(p => ({
      x: parseFloat((p.x - minX).toFixed(2)),
      y: parseFloat((p.y - minY).toFixed(2))
    }));
    
    const d = buildPathData(relativePoints, close);
    
    const id = generateUniqueId("layer-shape-path");
    const newLayer: CardLayer = {
      id,
      type: "shape",
      shapeType: "path",
      pathData: d,
      xMm: parseFloat(minX.toFixed(2)),
      yMm: parseFloat(minY.toFixed(2)),
      widthMm: parseFloat(w.toFixed(2)),
      heightMm: parseFloat(h.toFixed(2)),
      colorHex: close ? "#1e293b" : "transparent",
      strokeColor: "#ea580c",
      strokeWidthMm: close ? 0 : 0.8,
      rotation: 0,
      opacity: 1,
    };
    
    updateCurrentLayers(prev => [...prev, newLayer]);
    setSelectedLayerId(id);
    setIsDrawingPathMode(false);
    setDrawingPathPoints([]);
  };

  // Alignment Options
  const alignLayer = (alignment: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    if (!selectedLayer) return;

    updateCurrentLayers(prev => prev.map(l => {
      if (l.id !== selectedLayer.id) return l;

      let newX = l.xMm;
      let newY = l.yMm;

      if (alignment === "left") {
        newX = safeZoneMarginMm;
      } else if (alignment === "center") {
        newX = (widthMm - l.widthMm) / 2;
      } else if (alignment === "right") {
        newX = widthMm - l.widthMm - safeZoneMarginMm;
      } else if (alignment === "top") {
        newY = safeZoneMarginMm;
      } else if (alignment === "middle") {
        newY = (heightMm - l.heightMm) / 2;
      } else if (alignment === "bottom") {
        newY = heightMm - l.heightMm - safeZoneMarginMm;
      }

      return {
        ...l,
        xMm: Math.max(-5, Math.min(widthMm, parseFloat(newX.toFixed(2)))),
        yMm: Math.max(-5, Math.min(heightMm, parseFloat(newY.toFixed(2))))
      };
    }));
  };

  // Snapping guide detector
  const findSnapValue = (value: number, targets: number[], toleranceMm = 1.8) => {
    for (const target of targets) {
      if (Math.abs(value - target) <= toleranceMm) {
        return { snapped: true, value: target };
      }
    }
    return { snapped: false, value };
  };

  // Drag and Drop Mouse listeners
  const handleWorkspacePointerDown = (e: React.PointerEvent, layer: CardLayer, action: "drag" | "resize" = "drag", dir?: string) => {
    e.stopPropagation();
    setSelectedLayerId(layer.id);

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (action === "drag") {
      // Offset from layer top-left in mm coordinates
      const layerXOnScreen = layer.xMm * zoomFactor;
      const layerYOnScreen = layer.yMm * zoomFactor;
      
      const workspaceEl = workspaceRef.current;
      if (!workspaceEl) return;
      const parentRect = workspaceEl.getBoundingClientRect();
      
      const clickXMm = (clientX - parentRect.left) / zoomFactor - bleedDistanceMm;
      const clickYMm = (clientY - parentRect.top) / zoomFactor - bleedDistanceMm;

      setDragOffset({
        x: clickXMm - layer.xMm,
        y: clickYMm - layer.yMm,
      });
      setResizeDirection(null);
    } else if (action === "resize" && dir) {
      setResizeDirection(dir);
      setOriginalLayerRect({
        x: layer.xMm,
        y: layer.yMm,
        w: layer.widthMm,
        h: layer.heightMm
      });
      setDragOffset({
        x: clientX,
        y: clientY
      });
    }
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    if (!selectedLayer || (!dragOffset && !resizeDirection)) return;

    const workspaceEl = workspaceRef.current;
    if (!workspaceEl) return;
    const rect = workspaceEl.getBoundingClientRect();

    const currentXMm = (e.clientX - rect.left) / zoomFactor;
    const currentYMm = (e.clientY - rect.top) / zoomFactor;

    if (dragOffset && !resizeDirection) {
      // Standard layer drag
      let targetX = currentXMm - dragOffset.x;
      let targetY = currentYMm - dragOffset.y;

      let snappedXLine = undefined;
      let snappedYLine = undefined;

      if (snapToGuides) {
        // Potential snap anchors (Card Center, Safe Margins, Bleeds)
        const xSnapPoints = [
          widthMm / 2 - selectedLayer.widthMm / 2, // Horiz card center
          safeZoneMarginMm, // left safe
          widthMm - selectedLayer.widthMm - safeZoneMarginMm, // right safe
        ];
        const ySnapPoints = [
          heightMm / 2 - selectedLayer.heightMm / 2, // Vert card center
          safeZoneMarginMm, // top safe
          heightMm - selectedLayer.heightMm - safeZoneMarginMm, // bottom safe
        ];

        const snapX = findSnapValue(targetX, xSnapPoints);
        if (snapX.snapped) {
          targetX = snapX.value;
          snappedXLine = snapX.value + selectedLayer.widthMm / 2;
        }

        const snapY = findSnapValue(targetY, ySnapPoints);
        if (snapY.snapped) {
          targetY = snapY.value;
          snappedYLine = snapY.value + selectedLayer.heightMm / 2;
        }
      }

      setSnapLines({ x: snappedXLine, y: snappedYLine });

      updateCurrentLayers(prev => prev.map(l => {
        if (l.id !== selectedLayer.id) return l;
        return {
          ...l,
          xMm: parseFloat(targetX.toFixed(2)),
          yMm: parseFloat(targetY.toFixed(2))
        };
      }));
    } else if (resizeDirection && originalLayerRect && dragOffset) {
      // Resize handles
      const deltaX = (e.clientX - dragOffset.x) / zoomFactor;
      const deltaY = (e.clientY - dragOffset.y) / zoomFactor;

      let newWidth = originalLayerRect.w;
      let newHeight = originalLayerRect.h;
      let newX = originalLayerRect.x;
      let newY = originalLayerRect.y;

      if (resizeDirection.includes("e")) {
        newWidth = Math.max(2, originalLayerRect.w + deltaX);
      }
      if (resizeDirection.includes("s")) {
        newHeight = Math.max(2, originalLayerRect.h + deltaY);
      }
      if (resizeDirection.includes("w")) {
        const potentialWidth = originalLayerRect.w - deltaX;
        if (potentialWidth > 2) {
          newWidth = potentialWidth;
          newX = originalLayerRect.x + deltaX;
        }
      }
      if (resizeDirection.includes("n")) {
        const potentialHeight = originalLayerRect.h - deltaY;
        if (potentialHeight > 2) {
          newHeight = potentialHeight;
          newY = originalLayerRect.y + deltaY;
        }
      }

      updateCurrentLayers(prev => prev.map(l => {
        if (l.id !== selectedLayer.id) return l;
        return {
          ...l,
          xMm: parseFloat(newX.toFixed(2)),
          yMm: parseFloat(newY.toFixed(2)),
          widthMm: parseFloat(newWidth.toFixed(2)),
          heightMm: parseFloat(newHeight.toFixed(2))
        };
      }));
    }
  };

  const handlePointerUp = () => {
    setDragOffset(null);
    setResizeDirection(null);
    setOriginalLayerRect(null);
    setSnapLines({});
  };

  const handleToolbarDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingToolbar(true);
    toolbarDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: toolbarOffset.x,
      startY: toolbarOffset.y
    };
  };

  // Upload custom picture/logo
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const id = generateUniqueId("layer-image");
      const newLayer: CardLayer = {
        id,
        type: "image",
        imageUrl: url,
        xMm: 15,
        yMm: 15,
        widthMm: 25,
        heightMm: 25,
        rotation: 0,
        opacity: 1,
        colorHex: "#1C1917" // fallback
      };
      updateCurrentLayers(prev => [...prev, newLayer]);
      setSelectedLayerId(id);
    };
    reader.readAsDataURL(file);
  };

  // Generate with Gemini AI
  const handleGenerateTemplate = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiError(null);

    try {
      const response = await fetch("/app/api/gemini/route", { // Note: app API path is absolute /api/gemini/generate but matches our NextJS route
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, businessType }),
      });

      if (!response.ok) {
        // Safe fallback call
        const backupRes = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: aiPrompt, businessType }),
        });
        if (!backupRes.ok) {
          throw new Error("Failed to communicate with AI server route.");
        }
        const data = await backupRes.json();
        applyGeneratedData(data);
        return;
      }

      const data = await response.json();
      applyGeneratedData(data);
    } catch (err: any) {
      console.warn("Retrying direct API request route map fallback", err);
      // Try Direct /api/gemini/generate route
      try {
        const responseDirect = await fetch("/api/gemini/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: aiPrompt, businessType }),
        });
        if (responseDirect.ok) {
          const data = await responseDirect.json();
          applyGeneratedData(data);
          return;
        }
      } catch (innerErr) {
        console.error(innerErr);
      }
      setAiError("AI layout generation failed. Please type standard info or try again.");
    } finally {
      setAiGenerating(false);
    }
  };

  const applyGeneratedData = (data: any) => {
    if (!data || !data.frontLayers) {
      setAiError("AI returned unexpected structural formatting.");
      return;
    }

    // Adapt front layers
    const frontendLayersParsed: CardLayer[] = data.frontLayers.map((l: any, idx: number) => ({
      id: l.id || `ai-front-${idx}`,
      type: "text",
      text: l.text,
      xMm: Math.max(safeZoneMarginMm, Math.min(widthMm - 20, l.xMmMm || l.xMm || 15)),
      yMm: Math.max(safeZoneMarginMm, Math.min(heightMm - 8, l.yMmMm || l.yMm || 15)),
      widthMm: 50,
      heightMm: 5,
      fontSizeMm: l.fontSizeMm || 3.0,
      fontWeight: l.fontWeight === "bold" ? "bold" : "normal",
      fontFamily: data.fontFamily || "Outfit",
      colorHex: idx === 0 ? (data.secondaryColor || "#A3E635") : (data.textColor || "#F8FAFC"),
      textAlign: l.textAlign || "left",
      letterSpacingMm: l.letterSpacingMm || 0.1,
      rotation: 0,
      opacity: 1
    }));

    // Add Logo Crest shape
    frontendLayersParsed.unshift({
      id: "ai-crest-logo",
      type: "shape",
      shapeType: "logo-badge",
      xMm: safeZoneMarginMm,
      yMm: safeZoneMarginMm,
      widthMm: 10,
      heightMm: 10,
      colorHex: data.secondaryColor || "#F97316",
      rotation: 0,
      opacity: 1
    });

    const backendLayersParsed: CardLayer[] = data.backLayers.map((l: any, idx: number) => ({
      id: l.id || `ai-back-${idx}`,
      type: "text",
      text: l.text,
      xMm: Math.max(5, Math.min(widthMm - 10, l.xMm || 10)),
      yMm: Math.max(5, Math.min(heightMm - 8, l.yMm || 10)),
      widthMm: 65,
      heightMm: 6,
      fontSizeMm: l.fontSizeMm || 2.8,
      fontWeight: l.fontWeight === "bold" ? "bold" : "normal",
      fontFamily: data.fontFamily || "Outfit",
      colorHex: data.textColor || "#FFFFFF",
      textAlign: l.textAlign || "center",
      letterSpacingMm: l.letterSpacingMm || 0.4,
      rotation: 0,
      opacity: 1
    }));

    // Add high fidelity background rectangle to match theme coloring!
    backendLayersParsed.unshift({
      id: "ai-background-fill",
      type: "shape",
      shapeType: "rect",
      xMm: 0,
      yMm: 0,
      widthMm: widthMm,
      heightMm: heightMm,
      colorHex: data.primaryColor || "#0F172A",
      rotation: 0,
      opacity: 1
    });

    setLayers({
      front: frontendLayersParsed,
      back: backendLayersParsed
    });
    setSelectedLayerId(frontendLayersParsed[1]?.id || null);
    setAiPrompt("");
  };

  // EXPORT PIPELINE: Renders the active card at high resolution (300 DPI) using standard high-res Canvas setup.
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const renderToCanvas = (side: "front" | "back", exportDpi = 300): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      // Calculate sizing. 1 inch = 25.4 millimeters
      const mmToInchesWidth = widthMm / 25.4;
      const mmToInchesHeight = heightMm / 25.4;
      
      const widthPx = Math.round(mmToInchesWidth * exportDpi);
      const heightPx = Math.round(mmToInchesHeight * exportDpi);

      canvas.width = widthPx;
      canvas.height = heightPx;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve("");
        return;
      }

      // Fill Background White
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, widthPx, heightPx);

      const targetLayers = layers[side];
      const scale = widthPx / widthMm; // pixels per mm

      // Render each layer
      targetLayers.forEach((layer) => {
        ctx.save();

        const xPx = layer.xMm * scale;
        const yPx = layer.yMm * scale;
        const wPx = layer.widthMm * scale;
        const hPx = layer.heightMm * scale;

        // Apply rotation
        ctx.translate(xPx + wPx / 2, yPx + hPx / 2);
        ctx.rotate((layer.rotation * Math.PI) / 180);
        ctx.translate(-(xPx + wPx / 2), -(yPx + hPx / 2));

        ctx.globalAlpha = layer.opacity;

        if (layer.type === "shape") {
          // Resolve canvas coordinates fill style (with support for gradients!)
          let fillStyle: string | CanvasGradient = layer.colorHex;
          if (layer.gradientType && layer.gradientType !== "none" && layer.gradientStartColor && layer.gradientEndColor) {
            if (layer.gradientType === "linear") {
              const angleRad = ((layer.gradientAngle ?? 90) * Math.PI) / 180;
              const x0 = xPx + wPx / 2 - (wPx / 2) * Math.cos(angleRad);
              const y0 = yPx + hPx / 2 - (hPx / 2) * Math.sin(angleRad);
              const x1 = xPx + wPx / 2 + (wPx / 2) * Math.cos(angleRad);
              const y1 = yPx + hPx / 2 + (hPx / 2) * Math.sin(angleRad);
              const grad = ctx.createLinearGradient(x0, y0, x1, y1);
              grad.addColorStop(0, layer.gradientStartColor);
              grad.addColorStop(1, layer.gradientEndColor);
              fillStyle = grad;
            } else if (layer.gradientType === "radial") {
              const grad = ctx.createRadialGradient(
                xPx + wPx / 2, yPx + hPx / 2, 0,
                xPx + wPx / 2, yPx + hPx / 2, Math.max(wPx, hPx) / 2
              );
              grad.addColorStop(0, layer.gradientStartColor);
              grad.addColorStop(1, layer.gradientEndColor);
              fillStyle = grad;
            }
          }
          ctx.fillStyle = fillStyle;

          if (layer.shapeType === "rect") {
            ctx.fillRect(xPx, yPx, wPx, hPx);
          } else if (layer.shapeType === "circle") {
            ctx.beginPath();
            ctx.arc(xPx + wPx / 2, yPx + hPx / 2, Math.min(wPx, hPx) / 2, 0, 2 * Math.PI);
            ctx.fill();
          } else if (layer.shapeType === "ellipse") {
            ctx.beginPath();
            ctx.ellipse(xPx + wPx / 2, yPx + hPx / 2, wPx / 2, hPx / 2, 0, 0, 2 * Math.PI);
            ctx.fill();
          } else if (layer.shapeType === "triangle") {
            ctx.beginPath();
            ctx.moveTo(xPx + wPx / 2, yPx);
            ctx.lineTo(xPx + wPx, yPx + hPx);
            ctx.lineTo(xPx, yPx + hPx);
            ctx.closePath();
            ctx.fill();
          } else if (layer.shapeType === "star") {
            ctx.beginPath();
            const cx = wPx / 2;
            const cy = hPx / 2;
            const spikes = 5;
            const outerRadius = Math.min(wPx, hPx) / 2;
            const innerRadius = outerRadius * 0.4;
            let rot = Math.PI / 2 * 3;
            const step = Math.PI / spikes;
            ctx.moveTo(cx + xPx, yPx + cy - outerRadius);
            for (let i = 0; i < spikes; i++) {
              let px = cx + Math.cos(rot) * outerRadius;
              let py = cy + Math.sin(rot) * outerRadius;
              ctx.lineTo(px + xPx, py + yPx);
              rot += step;

              px = cx + Math.cos(rot) * innerRadius;
              py = cy + Math.sin(rot) * innerRadius;
              ctx.lineTo(px + xPx, py + yPx);
              rot += step;
            }
            ctx.closePath();
            ctx.fill();
          } else if (layer.shapeType === "hexagon") {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI) / 3 - Math.PI / 2;
              const px = xPx + wPx / 2 + (wPx / 2) * Math.cos(angle);
              const py = yPx + hPx / 2 + (hPx / 2) * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          } else if (layer.shapeType === "pentagon") {
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
              const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
              const px = xPx + wPx / 2 + (wPx / 2) * Math.cos(angle);
              const py = yPx + hPx / 2 + (hPx / 2) * Math.sin(angle);
              if (i === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
          } else if (layer.shapeType === "line") {
            ctx.beginPath();
            ctx.moveTo(xPx, yPx);
            ctx.lineTo(xPx + wPx, yPx + hPx);
            ctx.strokeStyle = fillStyle;
            ctx.lineWidth = (layer.strokeWidthMm || 0.8) * scale;
            ctx.stroke();
          } else if (layer.shapeType === "path" && layer.pathData) {
            try {
              const p2d = new Path2D(layer.pathData);
              ctx.save();
              ctx.translate(xPx, yPx);
              ctx.scale(scale, scale);
              ctx.fill(p2d);
              if (layer.strokeWidthMm && layer.strokeWidthMm > 0) {
                ctx.strokeStyle = layer.strokeColor || "#000000";
                ctx.lineWidth = layer.strokeWidthMm;
                ctx.stroke(p2d);
              }
              ctx.restore();
            } catch (e) {
              console.error("Error rendering path in canvas", e);
            }
          } else if (layer.shapeType === "logo-badge") {
            // Draw luxury double diamonds vector
            ctx.beginPath();
            ctx.moveTo(xPx + wPx / 2, yPx);
            ctx.lineTo(xPx + wPx, yPx + hPx / 2);
            ctx.lineTo(xPx + wPx / 2, yPx + hPx);
            ctx.lineTo(xPx, yPx + hPx / 2);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 1.5 * (scale / 4);
            ctx.stroke();
          }
        } else if (layer.type === "icon") {
          try {
            const pathString = SVG_ICONS[layer.iconName || "phone"] || SVG_ICONS["phone"];
            const p2d = new Path2D(pathString);
            ctx.save();
            ctx.translate(xPx, yPx);
            const scaleX = wPx / 24;
            const scaleY = hPx / 24;
            ctx.scale(scaleX, scaleY);

            // Resolve gradient color if present
            let iconColor: string | CanvasGradient = layer.colorHex;
            if (layer.gradientType && layer.gradientType !== "none" && layer.gradientStartColor && layer.gradientEndColor) {
              if (layer.gradientType === "linear") {
                const angleRad = ((layer.gradientAngle ?? 90) * Math.PI) / 180;
                const grad = ctx.createLinearGradient(12 - 12 * Math.cos(angleRad), 12 - 12 * Math.sin(angleRad), 12 + 12 * Math.cos(angleRad), 12 + 12 * Math.sin(angleRad));
                grad.addColorStop(0, layer.gradientStartColor);
                grad.addColorStop(1, layer.gradientEndColor);
                iconColor = grad;
              }
            }

            if (layer.iconFill) {
              ctx.fillStyle = iconColor;
              ctx.fill(p2d);
            } else {
              ctx.strokeStyle = iconColor;
              // Convert strokeWidth to 24-scale space correctly
              const strokeWidth = (layer.strokeWidthMm || 0.8) * (24 / layer.widthMm);
              ctx.lineWidth = strokeWidth;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.stroke(p2d);
            }
            ctx.restore();
          } catch (e) {
            console.error("Error rendering icon on canvas", e);
          }
        } else if (layer.type === "text" && layer.text) {
          ctx.fillStyle = layer.colorHex;
          const fitFontSizeMm = getRenderFontSizeMm(layer);
          const fontHeight = fitFontSizeMm * scale;
          const fontWeightValue = layer.fontWeight || "normal";
          const fontStyleValue = layer.fontStyle || "normal";
          
          // Select loaded fallback
          let fontFam = "sans-serif";
          if (layer.fontFamily) {
            fontFam = `var(--font-${layer.fontFamily.toLowerCase().replace(" ", "")}), ${layer.fontFamily}, sans-serif`;
          }

          ctx.font = `${fontStyleValue} ${fontWeightValue} ${fontHeight}px ${fontFam}`;
          ctx.textBaseline = "top";

          // Letter spacing helper
          const cleanText = layer.text;
          const textWidth = ctx.measureText(cleanText).width;

          let startX = xPx;
          if (layer.textAlign === "center") {
            startX = xPx + (wPx - textWidth) / 2;
          } else if (layer.textAlign === "right") {
            startX = xPx + wPx - textWidth;
          }

          if (layer.strokeWidthMm && layer.strokeWidthMm > 0) {
            ctx.strokeStyle = layer.strokeColor || "#000000";
            ctx.lineWidth = layer.strokeWidthMm * scale;
            ctx.strokeText(cleanText, startX, yPx);
          }
          ctx.fillText(cleanText, startX, yPx);
        } else if (layer.type === "image" && layer.imageUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = layer.imageUrl;
          img.onload = () => {
            ctx.drawImage(img, xPx, yPx, wPx, hPx);
            ctx.restore();
          };
          return;
        } else if (layer.type === "custom-svg" && layer.customSvgString) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layer.widthMm} ${layer.heightMm}" width="${layer.widthMm}" height="${layer.heightMm}">${layer.customSvgString}</svg>`
          );
          img.onload = () => {
            ctx.drawImage(img, xPx, yPx, wPx, hPx);
            ctx.restore();
          };
          return;
        }

        ctx.restore();
      });

      // Quick timeout to allow immediate resolution
      setTimeout(() => {
        resolve(canvas.toDataURL("image/png"));
      }, 80);
    });
  };

  // Trigger browser download workflow
  const triggerImageExport = async (format: "png" | "webp" | "svg") => {
    if (format === "svg") {
      const svgContent = generateSvgString();
      const blob = new Blob([svgContent], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BusinessCard-${currentSide}-${selectedPreset}.svg`;
      link.click();
      return;
    }

    const dataUrl = await renderToCanvas(currentSide, format === "png" ? 300 : 150);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `BusinessCard-${currentSide}-${selectedPreset}.${format}`;
    link.click();
  };

  // Standalone raw HTML export
  const triggerHtmlExport = () => {
    const rawHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Metric Corporate Business Card - ${currentSide}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Outfit:wght@400;700&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@450;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; background: #fafaf9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .trim-card { width: ${widthMm}mm; height: ${heightMm}mm; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.08); position: relative; overflow: hidden; border-radius: ${roundedCorners ? "8px" : "0px"}; }
  </style>
</head>
<body>
  <div class="trim-card">
    ${generateSvgString()}
  </div>
</body>
</html>`;

    const blob = new Blob([rawHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BusinessCard-${selectedPreset}.html`;
    link.click();
  };

  // SVG representation builder used inside workspaces and downloads
  const generateSvgString = (side: "front" | "back" = currentSide) => {
    const sideLayers = layers[side];
    
    // Assemble linear/radial gradient definitions
    const gradientDefinitions = sideLayers.map(l => {
      if (l.gradientType && l.gradientType !== "none" && l.gradientStartColor && l.gradientEndColor) {
        if (l.gradientType === "linear") {
          const angle = l.gradientAngle ?? 90;
          const angleRad = (angle * Math.PI) / 180;
          const x1 = Math.round(50 - 50 * Math.cos(angleRad));
          const y1 = Math.round(50 - 50 * Math.sin(angleRad));
          const x2 = Math.round(50 + 50 * Math.cos(angleRad));
          const y2 = Math.round(50 + 50 * Math.sin(angleRad));
          return `
    <linearGradient id="grad-${l.id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
      <stop offset="0%" stop-color="${l.gradientStartColor}" />
      <stop offset="100%" stop-color="${l.gradientEndColor}" />
    </linearGradient>`;
        } else if (l.gradientType === "radial") {
          return `
    <radialGradient id="grad-${l.id}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${l.gradientStartColor}" />
      <stop offset="100%" stop-color="${l.gradientEndColor}" />
    </radialGradient>`;
        }
      }
      return "";
    }).filter(Boolean).join("\n");

    const layersMarkup = sideLayers.map((layer) => {
      const transform = `rotate(${layer.rotation}, ${layer.xMm + layer.widthMm/2}, ${layer.yMm + layer.heightMm/2})`;
      const opacity = layer.opacity;

      const hasGradient = layer.gradientType && layer.gradientType !== "none" && layer.gradientStartColor && layer.gradientEndColor;
      const fillSource = hasGradient ? `url(#grad-${layer.id})` : layer.colorHex;

      if (layer.type === "shape") {
        if (layer.shapeType === "rect") {
          return `<rect x="${layer.xMm}" y="${layer.yMm}" width="${layer.widthMm}" height="${layer.heightMm}" fill="${fillSource}" transform="${transform}" opacity="${opacity}" />`;
        } else if (layer.shapeType === "circle") {
          const r = Math.min(layer.widthMm, layer.heightMm) / 2;
          return `<circle cx="${layer.xMm + layer.widthMm/2}" cy="${layer.yMm + layer.heightMm/2}" r="${r}" fill="${fillSource}" transform="${transform}" opacity="${opacity}" />`;
        } else if (layer.shapeType === "ellipse") {
          return `<ellipse cx="${layer.xMm + layer.widthMm/2}" cy="${layer.yMm + layer.heightMm/2}" rx="${layer.widthMm/2}" ry="${layer.heightMm/2}" fill="${fillSource}" transform="${transform}" opacity="${opacity}" />`;
        } else if (layer.shapeType === "triangle") {
          return `<polygon points="${layer.xMm + layer.widthMm/2},${layer.yMm} ${layer.xMm + layer.widthMm},${layer.yMm + layer.heightMm} ${layer.xMm},${layer.yMm + layer.heightMm}" fill="${fillSource}" transform="${transform}" opacity="${opacity}" />`;
        } else if (layer.shapeType === "star") {
          const cx = layer.widthMm / 2;
          const cy = layer.heightMm / 2;
          const spikes = 5;
          const outerRadius = Math.min(layer.widthMm, layer.heightMm) / 2;
          const innerRadius = outerRadius * 0.4;
          let rot = Math.PI / 2 * 3;
          const step = Math.PI / spikes;
          const pts = [];
          for (let i = 0; i < spikes; i++) {
            pts.push(`${cx + Math.cos(rot) * outerRadius},${cy + Math.sin(rot) * outerRadius}`);
            rot += step;
            pts.push(`${cx + Math.cos(rot) * innerRadius},${cy + Math.sin(rot) * innerRadius}`);
            rot += step;
          }
          return `<polygon points="${pts.join(" ")}" fill="${fillSource}" transform="translate(${layer.xMm}, ${layer.yMm}) ${transform}" opacity="${opacity}" />`;
        } else if (layer.shapeType === "hexagon") {
          const cx = layer.widthMm / 2;
          const cy = layer.heightMm / 2;
          const pts = [];
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3 - Math.PI / 2;
            pts.push(`${cx + (layer.widthMm / 2) * Math.cos(angle)},${cy + (layer.heightMm / 2) * Math.sin(angle)}`);
          }
          return `<polygon points="${pts.join(" ")}" fill="${fillSource}" transform="translate(${layer.xMm}, ${layer.yMm}) ${transform}" opacity="${opacity}" />`;
        } else if (layer.shapeType === "pentagon") {
          const cx = layer.widthMm / 2;
          const cy = layer.heightMm / 2;
          const pts = [];
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
            pts.push(`${cx + (layer.widthMm / 2) * Math.cos(angle)},${cy + (layer.heightMm / 2) * Math.sin(angle)}`);
          }
          return `<polygon points="${pts.join(" ")}" fill="${fillSource}" transform="translate(${layer.xMm}, ${layer.yMm}) ${transform}" opacity="${opacity}" />`;
        } else if (layer.shapeType === "line") {
          return `<line x1="${layer.xMm}" y1="${layer.yMm}" x2="${layer.xMm + layer.widthMm}" y2="${layer.yMm + layer.heightMm}" stroke="${fillSource}" stroke-width="${layer.strokeWidthMm || 0.8}" transform="${transform}" opacity="${opacity}" stroke-linecap="round" />`;
        } else if (layer.shapeType === "path" && layer.pathData) {
          let strokeStr = "";
          if (layer.strokeWidthMm && layer.strokeWidthMm > 0) {
            strokeStr = `stroke="${layer.strokeColor || "#000000"}" stroke-width="${layer.strokeWidthMm}"`;
          }
          return `<g transform="translate(${layer.xMm}, ${layer.yMm}) ${transform}" opacity="${opacity}"><path d="${layer.pathData}" fill="${fillSource}" ${strokeStr} /></g>`;
        } else if (layer.shapeType === "logo-badge") {
          return `
          <g transform="translate(${layer.xMm}, ${layer.yMm}) ${transform}" opacity="${opacity}">
            <path d="M ${layer.widthMm/2} 0 L ${layer.widthMm} ${layer.heightMm/2} L ${layer.widthMm/2} ${layer.heightMm} L 0 ${layer.heightMm/2} Z" fill="${fillSource}" />
            <path d="M ${layer.widthMm/2} 2 L ${layer.widthMm - 2} ${layer.heightMm/2} L ${layer.widthMm/2} ${layer.heightMm - 2} L 2 ${layer.heightMm/2} Z" fill="none" stroke="#FFFFFF" stroke-width="0.8" />
          </g>`;
        }
      } else if (layer.type === "icon") {
        const pathString = SVG_ICONS[layer.iconName || "phone"] || SVG_ICONS["phone"];
        const strokeStr = layer.iconFill ? "" : `stroke="${fillSource}" stroke-width="${layer.strokeWidthMm || 0.8}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
        const fillStr = layer.iconFill ? `fill="${fillSource}"` : `fill="none"`;
        
        return `<g transform="translate(${layer.xMm}, ${layer.yMm}) scale(${layer.widthMm/24}, ${layer.heightMm/24}) ${transform}" opacity="${opacity}"><path d="${pathString}" ${fillStr} ${strokeStr} /></g>`;
      } else if (layer.type === "text" && layer.text) {
        let textAnchor = "start";
        let textX = layer.xMm;
        if (layer.textAlign === "center") {
          textAnchor = "middle";
          textX = layer.xMm + layer.widthMm / 2;
        } else if (layer.textAlign === "right") {
          textAnchor = "end";
          textX = layer.xMm + layer.widthMm;
        }

        const renderFontValMm = getRenderFontSizeMm(layer);

        const fontStyles = [
          `font-family: ${layer.fontFamily || "Outfit"}, sans-serif`,
          `font-size: ${renderFontValMm}px`,
          `font-weight: ${layer.fontWeight || "normal"}`,
          layer.fontStyle === "italic" ? "font-style: italic" : "",
          layer.letterSpacingMm ? `letter-spacing: ${layer.letterSpacingMm}px` : ""
        ].filter(Boolean).join("; ");

        let strokeAttributes = "";
        if (layer.strokeWidthMm && layer.strokeWidthMm > 0) {
          strokeAttributes = `stroke="${layer.strokeColor || "#000000"}" stroke-width="${layer.strokeWidthMm}px" paint-order="stroke fill"`;
        }

        // Convert newlines if any
        return `<text x="${textX}" y="${layer.yMm}" fill="${fillSource}" ${strokeAttributes} style="${fontStyles}" text-anchor="${textAnchor}" transform="${transform}" opacity="${opacity}" dominant-baseline="hanging">${layer.text}</text>`;
      } else if (layer.type === "image" && layer.imageUrl) {
        return `<image href="${layer.imageUrl}" x="${layer.xMm}" y="${layer.yMm}" width="${layer.widthMm}" height="${layer.heightMm}" transform="${transform}" opacity="${opacity}" />`;
      } else if (layer.type === "custom-svg" && layer.customSvgString) {
        return `<g transform="translate(${layer.xMm}, ${layer.yMm}) ${transform}" opacity="${opacity}">${layer.customSvgString}</g>`;
      }
      return "";
    }).join("\n");

    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthMm} ${heightMm}" width="100%" height="100%" style="background:#FFFFFF;">
  <defs>
    ${gradientDefinitions}
  </defs>
  ${layersMarkup}
</svg>`;
  };

  // High resolution print ready PDF setup with Crop Marks
  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB]/50 text-stone-800 flex flex-col antialiased selection:bg-amber-100">
      
      {/* 1. Header & AI Assist Area */}
      <header className="bg-white border-b border-stone-200/60 sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <div className="bg-amber-600 text-white rounded-md p-1.5 shadow-sm">
              <Layout className="w-5 h-5" id="logo-icon-svg" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-stone-900 flex items-center gap-1.5">
                METRIC STUDIO <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-500 font-mono">300 DPI</span>
              </h1>
              <p className="text-[11px] text-stone-500 font-mono">Professional Print Template Director</p>
            </div>
          </div>

          {/* Prompt AI generator */}
          <div className="flex-1 max-w-lg mx-md-4 min-w-[280px]">
            <div className="relative flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-lg p-1">
              <Sparkles className="text-amber-600 w-3.5 h-3.5 ml-2 shrink-0 animate-pulse" />
              <input 
                type="text" 
                placeholder="Gemini prompt: 'Sleek luxury real estate agent card with copper tone'..."
                className="w-full text-xs bg-transparent focus:outline-none pl-1 pr-12 text-stone-800 placeholder:text-stone-400"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerateTemplate()}
              />
              <button 
                onClick={handleGenerateTemplate}
                disabled={aiGenerating}
                className="absolute right-1 text-[11px] bg-stone-900 hover:bg-amber-700 text-white px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                id="ai-generate-button"
              >
                {aiGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <span>Generate</span>
                    <SparkleIcon className="w-2.5 h-2.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleUndo} 
              disabled={history.length === 0}
              className="p-1.5 rounded border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 disabled:opacity-40 transition-opacity"
              title="Undo Last Action"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={handleTriggerPrint}
              className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              id="print-action-button"
            >
              <Printer className="w-4 h-4" />
              <span>Print PDF Crop-Sheet</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. Standard Workspace Canvas & Sidebars */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* --- LEFT SIDEBAR: Dynamic Layer Manager & Insert items --- */}
        <aside className={`bg-white border-r border-stone-200/80 flex flex-col transition-all duration-350 no-print overflow-y-auto shrink-0 ${leftMinimised ? "w-12" : "w-64"}`}>
          
          <div className="p-3 border-b border-stone-100 flex items-center justify-between">
            {!leftMinimised && <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-amber-600" /> Layers & Insert</h2>}
            <button 
              onClick={() => setLeftMinimised(!leftMinimised)}
              className="p-1 hover:bg-stone-100 rounded text-stone-400 ml-auto"
              title="Toggle Sidebar"
            >
              {leftMinimised ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {!leftMinimised && (
            <div className="p-3 flex flex-col gap-3">
              
              {/* Presets Sizing Selector */}
              <div>
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Standard Preset Size</label>
                <div className="grid grid-cols-2 gap-1 bg-stone-50 p-0.5 rounded-lg border border-stone-200">
                  <button 
                    onClick={() => setSelectedPreset("eu")}
                    className={`py-1 text-[11px] font-medium rounded-md transition-all ${selectedPreset === "eu" ? "bg-white text-stone-900 shadow-sm font-bold" : "text-stone-500 hover:text-stone-800"}`}
                  >
                    EU Standard <span className="block text-[8px] opacity-75">85 × 55 mm</span>
                  </button>
                  <button 
                    onClick={() => setSelectedPreset("us")}
                    className={`py-1 text-[11px] font-medium rounded-md transition-all ${selectedPreset === "us" ? "bg-white text-stone-900 shadow-sm font-bold" : "text-stone-500 hover:text-stone-800"}`}
                  >
                    US Standard <span className="block text-[8px] opacity-75">88.9 × 50.8 mm</span>
                  </button>
                </div>
              </div>

              {/* Draw rounded edges */}
              <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
                <div>
                  <span className="text-[11px] font-bold text-stone-700 block">Die-Cut Die corners</span>
                  <span className="text-[10px] text-stone-400 block font-mono">Die-cut radius preview</span>
                </div>
                <button 
                  onClick={() => setRoundedCorners(!roundedCorners)}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors ${roundedCorners ? "bg-amber-600" : "bg-stone-300"}`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${roundedCorners ? "translate-x-5" : ""}`} />
                </button>
              </div>

              {/* Add item buttons */}
              <div className="border-t border-stone-100 pt-3">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest block mb-2">Insert Elements</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={addTextLayer}
                      className="flex justify-center items-center gap-1.5 py-1.5 px-2 bg-stone-50 hover:bg-stone-100 active:bg-amber-50 rounded border border-stone-200 text-stone-700 font-medium text-[11px] transition-colors cursor-pointer"
                    >
                      <TypeIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>Plain Text</span>
                    </button>
                    
                    <button 
                      onClick={handleUploadClick}
                      className="flex justify-center items-center gap-1.5 py-1.5 px-2 bg-stone-50 hover:bg-stone-100 active:bg-amber-50 rounded border border-stone-200 text-stone-700 font-medium text-[11px] transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload Image</span>
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                  </div>

                  {/* Shapes Selection expansion */}
                  <div className="bg-stone-50/50 p-2 rounded-lg border border-stone-200/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Add Shape / Line</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { title: "Box", type: "rect", icon: <div className="w-3.5 h-2.5 border border-stone-700 rounded-sm" /> },
                        { title: "Circle", type: "circle", icon: <div className="w-3 h-3 border border-stone-700 rounded-full" /> },
                        { title: "Ellipse", type: "ellipse", icon: <div className="w-4 h-2.5 border border-stone-700 rounded-[50%]" /> },
                        { title: "Triangle", type: "triangle", icon: <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-stone-700" /> },
                        { title: "Star", type: "star", icon: <Star className="w-3 h-3 text-stone-700" /> },
                        { title: "Hexagon", type: "hexagon", icon: <Hexagon className="w-3 h-3 text-stone-700" /> },
                        { title: "Pentagon", type: "pentagon", icon: <svg className="w-3 h-3 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"><polygon points="12,2 22,9 18,22 6,22 2,9" /></svg> },
                        { title: "Line", type: "line", icon: <div className="w-4 h-0.5 bg-stone-700 rotate-12" /> },
                        { title: "Logo Shape", type: "logo-badge", icon: <Sparkle className="w-3 h-3 text-stone-700" /> },
                      ].map(sh => (
                        <button
                          key={sh.type}
                          title={sh.title}
                          onClick={() => addShapeLayer(sh.type as any)}
                          className="flex flex-col items-center justify-center p-1 bg-white hover:bg-stone-100 active:bg-amber-50 border border-stone-200 rounded text-[9px] text-stone-600 cursor-pointer h-10 gap-0.5"
                        >
                          {sh.icon}
                          <span className="truncate max-w-full text-[8.5px] font-medium leading-none">{sh.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Freehand Vector Path Creator tool */}
                  <div className="bg-stone-50/50 p-2 rounded-lg border border-stone-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Vector Path Tool</span>
                      <span className="text-[8px] font-mono text-amber-600 bg-amber-50 px-1 rounded font-bold">DRAWING</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsDrawingPathMode(true);
                        setDrawingPathPoints([]);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs rounded transition-colors cursor-pointer border border-amber-600/30"
                    >
                      <Brush className="w-3.5 h-3.5" />
                      <span>Draw Path Vector</span>
                    </button>
                  </div>

                  {/* Lucide Icons Library Integration */}
                  <div className="bg-stone-50/50 p-2 rounded-lg border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Insert Lucide Icons</span>
                      <button 
                        type="button" 
                        onClick={() => setIsIconPickerOpen(!isIconPickerOpen)}
                        className="text-[9px] text-amber-700 font-bold hover:underline cursor-pointer"
                      >
                        {isIconPickerOpen ? "Hide Icons" : "View Icons"}
                      </button>
                    </div>

                    {isIconPickerOpen && (
                      <div className="grid grid-cols-5 gap-1 max-h-36 overflow-y-auto bg-white p-1 rounded border border-stone-100">
                        {Object.keys(SVG_ICONS).map((iconKey) => (
                          <button
                            key={iconKey}
                            title={`Insert ${iconKey}`}
                            onClick={() => addIconLayer(iconKey)}
                            className="flex items-center justify-center p-1.5 hover:bg-amber-50 hover:border-amber-400 border border-stone-150 rounded cursor-pointer transition-all text-stone-700"
                          >
                            <svg className="w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d={SVG_ICONS[iconKey]} />
                            </svg>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Layer stack interactive ordering */}
              <div className="border-t border-stone-100 pt-3">
                <label className="text-[11px] font-bold text-stone-500 uppercase tracking-widest block mb-1">Canvas Layers Order</label>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {currentLayers.length === 0 ? (
                    <p className="text-[11px] text-stone-400 py-2 italic text-center">Empty side layers</p>
                  ) : (
                    currentLayers.map((l, index) => (
                      <div 
                        key={l.id}
                        onClick={() => setSelectedLayerId(l.id)}
                        className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-all ${selectedLayerId === l.id ? "bg-amber-50 border-l-2 border-amber-600 text-stone-900 font-medium" : "bg-stone-50 hover:bg-stone-100 border-l border-stone-200 text-stone-600"}`}
                      >
                        <span className="truncate max-w-[110px] font-mono text-[10px]">
                          {l.type === "text" ? `[T] ${l.text || "Empty text"}` : `[S] ${l.shapeType || l.type}`}
                        </span>
                        
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveZIndex("up", l.id); }}
                            className="p-0.5 hover:bg-stone-200 rounded text-stone-400"
                            title="Bring Forward"
                          >
                            <MoveUp className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); moveZIndex("down", l.id); }}
                            className="p-0.5 hover:bg-stone-200 rounded text-stone-400"
                            title="Send Backward"
                          >
                            <MoveDown className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteLayer(l.id); }}
                            className="p-0.5 hover:bg-red-100 rounded text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}
        </aside>

        {/* --- MAIN CENTER: Interactive Preview Workspace & Bleeds --- */}
        <main className="flex-1 flex flex-col p-4 md:p-6 items-center justify-start overflow-auto">
          
          {/* Card Side switcher & Zoom slider */}
          <div className="w-full max-w-xl mb-4 flex flex-wrap items-center justify-between gap-3 no-print">
            
            {/* Toggle Card Front vs Card Back */}
            <div className="flex gap-1.5 bg-stone-200/70 p-1 rounded-lg">
              <button 
                onClick={() => setCurrentSide("front")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${currentSide === "front" ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>FRONT (FACE)</span>
              </button>
              <button 
                onClick={() => setCurrentSide("back")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${currentSide === "back" ? "bg-white text-stone-950 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>BACK (REVERSE)</span>
              </button>
            </div>

            {/* Quick guide control indicators */}
            <div className="flex gap-2.5 items-center bg-white border border-stone-200/80 px-2.5 py-1 rounded-lg text-[11px] text-stone-500">
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showBleedGuides} 
                  onChange={() => setShowBleedGuides(!showBleedGuides)}
                  className="rounded border-stone-300 accent-amber-600 w-3 h-3" 
                />
                <span>Bleed (3mm)</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showSafeGuides} 
                  onChange={() => setShowSafeGuides(!showSafeGuides)}
                  className="rounded border-stone-300 accent-amber-600 w-3 h-3" 
                />
                <span>Safe boundaries</span>
              </label>
            </div>

            {/* Zoom multiplier */}
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-stone-400" />
              <input 
                type="range" 
                min="4.5" 
                max="12.0" 
                step="0.3"
                value={zoomFactor}
                onChange={(e) => setZoomFactor(parseFloat(e.target.value))}
                className="w-24 accent-amber-600"
                title="Workspace Size Factor"
              />
              <span className="text-[10px] font-mono text-stone-400">Zoom: {Math.round(zoomFactor * 10)}%</span>
            </div>

          </div>

          {/* Interactive Workspace Container with Drag Drop Listener callbacks */}
          <div 
            className={`relative flex items-center justify-center p-8 rounded-xl border shadow-inner overflow-hidden select-none transition-all duration-200 ${isDraggingOver ? "bg-amber-50/50 border-amber-400 scale-[1.01]" : "bg-stone-100 border-stone-200/50"}`}
            onMouseMove={handlePointerMove}
            onMouseLeave={handlePointerUp}
            onMouseUp={handlePointerUp}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleCanvasDrop}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu({
                visible: true,
                x: e.clientX,
                y: e.clientY,
                layerId: null,
              });
            }}
          >
            {/* Extended physical layout wrapper block including bleed zone overlay */}
            <div 
              ref={workspaceRef}
              className="relative bg-white shadow-xl border border-stone-300"
              style={{
                width: `${(widthMm + bleedDistanceMm * 2) * zoomFactor}px`,
                height: `${(heightMm + bleedDistanceMm * 2) * zoomFactor}px`,
                transition: "border 0.3s ease",
              }}
            >
              {/* Outer Bleed bounding guides overlaying the background layout canvas */}
              {showBleedGuides && (
                <div 
                  className="absolute pointer-events-none border border-red-400/80 border-dashed z-30"
                  style={{
                    inset: `0px`,
                  }}
                >
                  <span className="absolute top-1 left-2 text-[8px] bg-red-400 text-white font-mono rounded px-1 scale-90">Outer Bleed (3mm)</span>
                </div>
              )}

              {/* standard trim card block bounds */}
              <div 
                className={`absolute bg-white overflow-hidden ${roundedCorners ? "rounded-[16px]" : "rounded-none"}`}
                style={{
                  top: `${bleedDistanceMm * zoomFactor}px`,
                  left: `${bleedDistanceMm * zoomFactor}px`,
                  width: `${widthMm * zoomFactor}px`,
                  height: `${heightMm * zoomFactor}px`,
                  boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                }}
              >
                
                {/* Visual grid reference lines internally */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.02] grid grid-cols-12 grid-rows-6">
                  {Array.from({ length: 72 }).map((_, i) => (
                    <div key={i} className="border border-stone-850" />
                  ))}
                </div>

                {/* SVG Live Layer Visuals Rendered inside bounds */}
                <svg 
                  className="w-full h-full"
                  viewBox={`0 0 ${widthMm} ${heightMm}`}
                >
                  <defs>
                    {currentLayers.map(l => {
                      if (l.gradientType && l.gradientType !== "none" && l.gradientStartColor && l.gradientEndColor) {
                        const gradId = `ws-grad-${l.id}`;
                        if (l.gradientType === "linear") {
                          const angle = l.gradientAngle ?? 90;
                          const angleRad = (angle * Math.PI) / 180;
                          const x1 = Math.round(50 - 50 * Math.cos(angleRad));
                          const y1 = Math.round(50 - 50 * Math.sin(angleRad));
                          const x2 = Math.round(50 + 50 * Math.cos(angleRad));
                          const y2 = Math.round(50 + 50 * Math.sin(angleRad));
                          return (
                            <linearGradient key={gradId} id={gradId} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
                              <stop offset="0%" stopColor={l.gradientStartColor} />
                              <stop offset="100%" stopColor={l.gradientEndColor} />
                            </linearGradient>
                          );
                        } else if (l.gradientType === "radial") {
                          return (
                            <radialGradient key={gradId} id={gradId} cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor={l.gradientStartColor} />
                              <stop offset="100%" stopColor={l.gradientEndColor} />
                            </radialGradient>
                          );
                        }
                      }
                      return null;
                    })}
                  </defs>

                  {/* Map shapes / elements to render underneath interaction box */}
                  {currentLayers.map((l) => {
                    const transformStr = `rotate(${l.rotation} ${l.xMm + l.widthMm/2} ${l.yMm + l.heightMm/2})`;
                    const hasGradient = l.gradientType && l.gradientType !== "none" && l.gradientStartColor && l.gradientEndColor;
                    const fillValue = hasGradient ? `url(#ws-grad-${l.id})` : l.colorHex;

                    if (l.type === "shape") {
                      if (l.shapeType === "rect") {
                        return (
                          <rect 
                            key={l.id}
                            x={l.xMm} 
                            y={l.yMm} 
                            width={l.widthMm} 
                            height={l.heightMm} 
                            fill={fillValue} 
                            opacity={l.opacity}
                            transform={transformStr}
                          />
                        );
                      } else if (l.shapeType === "circle") {
                        return (
                          <circle 
                            key={l.id}
                            cx={l.xMm + l.widthMm/2} 
                            cy={l.yMm + l.heightMm/2} 
                            r={Math.min(l.widthMm, l.heightMm)/2} 
                            fill={fillValue} 
                            opacity={l.opacity}
                            transform={transformStr}
                          />
                        );
                      } else if (l.shapeType === "ellipse") {
                        return (
                          <ellipse 
                            key={l.id}
                            cx={l.xMm + l.widthMm/2} 
                            cy={l.yMm + l.heightMm/2} 
                            rx={l.widthMm/2} 
                            ry={l.heightMm/2} 
                            fill={fillValue} 
                            opacity={l.opacity}
                            transform={transformStr}
                          />
                        );
                      } else if (l.shapeType === "triangle") {
                        return (
                          <polygon 
                            key={l.id}
                            points={`${l.xMm + l.widthMm/2},${l.yMm} ${l.xMm + l.widthMm},${l.yMm + l.heightMm} ${l.xMm},${l.yMm + l.heightMm}`}
                            fill={fillValue} 
                            opacity={l.opacity}
                            transform={transformStr}
                          />
                        );
                      } else if (l.shapeType === "star") {
                        const cx = l.widthMm / 2;
                        const cy = l.heightMm / 2;
                        const spikes = 5;
                        const outerRadius = Math.min(l.widthMm, l.heightMm) / 2;
                        const innerRadius = outerRadius * 0.4;
                        let rotPoint = Math.PI / 2 * 3;
                        const step = Math.PI / spikes;
                        const pts = [];
                        for (let i = 0; i < spikes; i++) {
                          pts.push(`${cx + Math.cos(rotPoint) * outerRadius},${cy + Math.sin(rotPoint) * outerRadius}`);
                          rotPoint += step;
                          pts.push(`${cx + Math.cos(rotPoint) * innerRadius},${cy + Math.sin(rotPoint) * innerRadius}`);
                          rotPoint += step;
                        }
                        return (
                          <polygon 
                            key={l.id}
                            points={pts.join(" ")}
                            fill={fillValue} 
                            opacity={l.opacity}
                            transform={`translate(${l.xMm}, ${l.yMm}) ${transformStr}`}
                          />
                        );
                      } else if (l.shapeType === "hexagon") {
                        const cx = l.widthMm / 2;
                        const cy = l.heightMm / 2;
                        const pts = [];
                        for (let i = 0; i < 6; i++) {
                          const angle = (i * Math.PI) / 3 - Math.PI / 2;
                          pts.push(`${cx + (l.widthMm / 2) * Math.cos(angle)},${cy + (l.heightMm / 2) * Math.sin(angle)}`);
                        }
                        return (
                          <polygon 
                            key={l.id}
                            points={pts.join(" ")}
                            fill={fillValue} 
                            opacity={l.opacity}
                            transform={`translate(${l.xMm}, ${l.yMm}) ${transformStr}`}
                          />
                        );
                      } else if (l.shapeType === "pentagon") {
                        const cx = l.widthMm / 2;
                        const cy = l.heightMm / 2;
                        const pts = [];
                        for (let i = 0; i < 5; i++) {
                          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
                          pts.push(`${cx + (l.widthMm / 2) * Math.cos(angle)},${cy + (l.heightMm / 2) * Math.sin(angle)}`);
                        }
                        return (
                          <polygon 
                            key={l.id}
                            points={pts.join(" ")}
                            fill={fillValue} 
                            opacity={l.opacity}
                            transform={`translate(${l.xMm}, ${l.yMm}) ${transformStr}`}
                          />
                        );
                      } else if (l.shapeType === "line") {
                        return (
                          <line 
                            key={l.id}
                            x1={l.xMm} 
                            y1={l.yMm} 
                            x2={l.xMm + l.widthMm} 
                            y2={l.yMm + l.heightMm} 
                            stroke={fillValue} 
                            strokeWidth={l.strokeWidthMm || 0.8}
                            opacity={l.opacity}
                            transform={transformStr}
                            strokeLinecap="round"
                          />
                        );
                      } else if (l.shapeType === "path" && l.pathData) {
                        const strokeParams = l.strokeWidthMm && l.strokeWidthMm > 0 ? {
                          stroke: l.strokeColor || "#000000",
                          strokeWidth: l.strokeWidthMm,
                        } : {};
                        return (
                          <g key={l.id} transform={`translate(${l.xMm}, ${l.yMm}) ${transformStr}`} opacity={l.opacity}>
                            <path 
                              d={l.pathData} 
                              fill={fillValue} 
                              {...strokeParams}
                            />
                          </g>
                        );
                      } else if (l.shapeType === "logo-badge") {
                        return (
                          <g key={l.id} transform={`translate(${l.xMm}, ${l.yMm}) ${transformStr}`} opacity={l.opacity}>
                            <path d={`M ${l.widthMm/2} 0 L ${l.widthMm} ${l.heightMm/2} L ${l.widthMm/2} ${l.heightMm} L 0 ${l.heightMm/2} Z`} fill={fillValue} />
                            <path d={`M ${l.widthMm/2} 1.5 L ${l.widthMm - 1.5} ${l.heightMm/2} L ${l.widthMm/2} ${l.heightMm - 1.5} L 1.5 ${l.heightMm/2} Z`} fill="none" stroke="#FFFFFF" strokeWidth="0.5" />
                          </g>
                        );
                      }
                    } else if (l.type === "icon") {
                      const pathString = SVG_ICONS[l.iconName || "phone"] || SVG_ICONS["phone"];
                      const strokeParams = l.iconFill ? {} : {
                        stroke: fillValue,
                        strokeWidth: l.strokeWidthMm || 0.8,
                        strokeLinecap: "round" as const,
                        strokeLinejoin: "round" as const,
                        fill: "none"
                      };
                      const fillParams = l.iconFill ? { fill: fillValue } : { fill: "none" };
                      return (
                        <g key={l.id} transform={`translate(${l.xMm}, ${l.yMm}) scale(${l.widthMm/24}, ${l.heightMm/24}) ${transformStr}`} opacity={l.opacity}>
                          <path d={pathString} {...fillParams} {...strokeParams} />
                        </g>
                      );
                    } else if (l.type === "text" && l.text) {
                      let anchor: "start" | "middle" | "end" = "start";
                      let xPos = l.xMm;
                      if (l.textAlign === "center") {
                        anchor = "middle";
                        xPos = l.xMm + l.widthMm / 2;
                      } else if (l.textAlign === "right") {
                        anchor = "end";
                        xPos = l.xMm + l.widthMm;
                      }

                      const renderFontValMm = getRenderFontSizeMm(l);

                      return (
                        <text
                          key={l.id}
                          x={xPos}
                          y={l.yMm}
                          fill={fillValue}
                          opacity={l.opacity}
                          stroke={l.strokeWidthMm && l.strokeWidthMm > 0 ? (l.strokeColor || "#000000") : "none"}
                          strokeWidth={l.strokeWidthMm && l.strokeWidthMm > 0 ? `${l.strokeWidthMm}px` : undefined}
                          paintOrder="stroke fill"
                          style={{
                            fontFamily: l.fontFamily || "Outfit",
                            fontSize: `${renderFontValMm}px`,
                            fontWeight: l.fontWeight || "normal",
                            fontStyle: l.fontStyle || "normal",
                            letterSpacing: l.letterSpacingMm ? `${l.letterSpacingMm}px` : "normal"
                          }}
                          transform={transformStr}
                          textAnchor={anchor}
                          dominantBaseline="hanging"
                        >
                          {l.text}
                        </text>
                      );
                    } else if (l.type === "image" && l.imageUrl) {
                      return (
                        <image 
                          key={l.id}
                          href={l.imageUrl}
                          x={l.xMm}
                          y={l.yMm}
                          width={l.widthMm}
                          height={l.heightMm}
                          transform={transformStr}
                          opacity={l.opacity}
                        />
                      );
                    } else if (l.type === "custom-svg" && l.customSvgString) {
                      return (
                        <g 
                          key={l.id} 
                          transform={`translate(${l.xMm}, ${l.yMm}) ${transformStr}`} 
                          opacity={l.opacity}
                          dangerouslySetInnerHTML={{ __html: l.customSvgString }}
                        />
                      );
                    }
                    return null;
                  })}
                </svg>

                {/* Inner printable safe margin boundary dotted guides */}
                {showSafeGuides && (
                  <div 
                    className="absolute pointer-events-none border border-amber-600/50 border-dotted z-30"
                    style={{
                      top: `${safeZoneMarginMm * zoomFactor}px`,
                      left: `${safeZoneMarginMm * zoomFactor}px`,
                      right: `${safeZoneMarginMm * zoomFactor}px`,
                      bottom: `${safeZoneMarginMm * zoomFactor}px`,
                    }}
                  >
                    <span className="absolute bottom-1 right-2 text-[8px] bg-amber-600 text-white font-mono rounded px-1 scale-90">Safe Area</span>
                  </div>
                )}

                {/* 1. PATH DRAWING HELPER OVERLAY */}
                {isDrawingPathMode && (
                  <div 
                    className="absolute inset-0 bg-stone-900/10 cursor-crosshair z-40"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const parentRect = e.currentTarget.getBoundingClientRect();
                      const clickXMm = (e.clientX - parentRect.left) / zoomFactor - bleedDistanceMm;
                      const clickYMm = (e.clientY - parentRect.top) / zoomFactor - bleedDistanceMm;
                      // Bound coordinates to card layout boundaries
                      const roundedX = parseFloat(clickXMm.toFixed(2));
                      const roundedY = parseFloat(clickYMm.toFixed(2));
                      setDrawingPathPoints(prev => [...prev, { x: roundedX, y: roundedY }]);
                    }}
                  >
                    {/* Live Connected draft lines overlay */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${widthMm + 2 * bleedDistanceMm} ${heightMm + 2 * bleedDistanceMm}`}>
                      <g transform={`translate(${bleedDistanceMm}, ${bleedDistanceMm})`}>
                        {drawingPathPoints.length > 0 && (() => {
                          let d = `M ${drawingPathPoints[0].x} ${drawingPathPoints[0].y}`;
                          for (let i = 1; i < drawingPathPoints.length; i++) {
                            d += ` L ${drawingPathPoints[i].x} ${drawingPathPoints[i].y}`;
                          }
                          return (
                            <path 
                              d={d}
                              fill="none"
                              stroke="#D97706"
                              strokeWidth="0.8"
                              strokeDasharray="2,2"
                            />
                          );
                        })()}
                        {/* Render active dots */}
                        {drawingPathPoints.map((p, idx) => (
                          <g key={idx}>
                            <circle 
                              cx={p.x} 
                              cy={p.y} 
                              r="1.2" 
                              fill="#D97706" 
                              stroke="#FFFFFF" 
                              strokeWidth="0.3" 
                            />
                            <text 
                              x={p.x + 1.2} 
                              y={p.y - 1.2} 
                              fontSize="2.2" 
                              fill="#9A3412" 
                              fontWeight="bold" 
                              className="font-mono select-none"
                            >
                              {idx + 1}
                            </text>
                          </g>
                        ))}
                      </g>
                    </svg>

                    {/* Completion control bar floating inside workspace */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-stone-900 text-stone-100 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl z-50 animate-bounce no-print font-sans" onClick={(e) => e.stopPropagation()}>
                      <span className="text-xs font-mono text-stone-300">
                        Points clicked: <strong className="text-amber-400">{drawingPathPoints.length}</strong>
                      </span>
                      <div className="h-4 w-px bg-stone-700" />
                      <button
                        type="button"
                        onClick={() => finishPathDrawing(true)}
                        disabled={drawingPathPoints.length < 2}
                        className="text-xs bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-stone-950 font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors"
                      >
                        Close & Fill Shape
                      </button>
                      <button
                        type="button"
                        onClick={() => finishPathDrawing(false)}
                        disabled={drawingPathPoints.length < 2}
                        className="text-xs bg-stone-800 hover:bg-stone-700 border border-stone-600 disabled:opacity-50 text-white font-semibold px-2 py-1 rounded-full cursor-pointer transition-colors"
                      >
                        Open Stroke Line
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawingPathMode(false);
                          setDrawingPathPoints([]);
                        }}
                        className="text-xs text-stone-400 hover:text-white px-1.5 py-1 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. VECTOR VERTEX DRAGGABLE HANDLES OVERLAY */}
                {selectedLayerId && editingPathPointsLayerId === selectedLayerId && (() => {
                  const targetL = currentLayers.find(ly => ly.id === selectedLayerId);
                  if (!targetL || targetL.shapeType !== "path") return null;
                  
                  const points = parsePathPoints(targetL.pathData || "");
                  const isClosed = (targetL.pathData || "").toUpperCase().includes("Z");
                  
                  return (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox={`0 0 ${widthMm + 2 * bleedDistanceMm} ${heightMm + 2 * bleedDistanceMm}`}>
                      <g transform={`translate(${bleedDistanceMm}, ${bleedDistanceMm})`}>
                        {points.map((p, pIdx) => {
                          const absX = targetL.xMm + p.x;
                          const absY = targetL.yMm + p.y;
                          
                          return (
                            <circle 
                              key={pIdx}
                              cx={absX}
                              cy={absY}
                              r="1.4"
                              fill="#10B981"
                              stroke="#FFFFFF"
                              strokeWidth="0.4"
                              className="pointer-events-auto cursor-move animate-pulse"
                              style={{ pointerEvents: "auto" }}
                              onPointerDown={(pointerEvent) => {
                                pointerEvent.stopPropagation();
                                pointerEvent.preventDefault();
                                
                                const handlePointerMoveVertex = (moveEvent: PointerEvent) => {
                                  const parentEl = workspaceRef.current;
                                  if (!parentEl) return;
                                  
                                  const parentRect = parentEl.getBoundingClientRect();
                                  const mouseXMm = (moveEvent.clientX - parentRect.left) / zoomFactor - bleedDistanceMm;
                                  const mouseYMm = (moveEvent.clientY - parentRect.top) / zoomFactor - bleedDistanceMm;
                                  
                                  const relX = parseFloat((mouseXMm - targetL.xMm).toFixed(2));
                                  const relY = parseFloat((mouseYMm - targetL.yMm).toFixed(2));
                                  
                                  const updatedPoints = [...points];
                                  updatedPoints[pIdx] = { x: relX, y: relY };
                                  const newD = buildPathData(updatedPoints, isClosed);
                                  
                                  updateCurrentLayers(prev => prev.map(layerItem => {
                                    if (layerItem.id === targetL.id) {
                                      return { ...layerItem, pathData: newD };
                                    }
                                    return layerItem;
                                  }));
                                };
                                
                                const handlePointerUpVertex = () => {
                                  window.removeEventListener("pointermove", handlePointerMoveVertex);
                                  window.removeEventListener("pointerup", handlePointerUpVertex);
                                };
                                
                                window.addEventListener("pointermove", handlePointerMoveVertex);
                                window.addEventListener("pointerup", handlePointerUpVertex);
                              }}
                            />
                          );
                        })}
                      </g>
                    </svg>
                  );
                })()}

                {/* Snapping Assistant Indicator lines */}
                {snapLines.x !== undefined && (
                  <div 
                    className="absolute top-0 bottom-0 border-l border-amber-500 border-dashed z-40 pointer-events-none"
                    style={{ left: `${snapLines.x * zoomFactor}px` }}
                  />
                )}
                {snapLines.y !== undefined && (
                  <div 
                    className="absolute left-0 right-0 border-t border-amber-500 border-dashed z-40 pointer-events-none"
                    style={{ top: `${snapLines.y * zoomFactor}px` }}
                  />
                )}

              </div>

              {/* Draggable layers bounding handles elements on screen - placed OUTSIDE standard trim card to avoid overflow clipping issues */}
              {currentLayers.map((l) => {
                const isSelected = selectedLayerId === l.id;
                // Add bleedDistanceMm to align handles and menus exactly with standard printable area under the layout parent bounds
                const xPx = (l.xMm + bleedDistanceMm) * zoomFactor;
                const yPx = (l.yMm + bleedDistanceMm) * zoomFactor;
                const wPx = l.widthMm * zoomFactor;
                const hPx = l.heightMm * zoomFactor;

                return (
                  <div 
                    key={`handle-${l.id}`}
                    className={`absolute cursor-move group ${isSelected ? "z-40 border-2 border-amber-500" : "z-10 hover:border border-stone-400"}`}
                    style={{
                      left: `${xPx}px`,
                      top: `${yPx}px`,
                      width: `${wPx}px`,
                      height: `${hPx}px`,
                      transform: `rotate(${l.rotation}deg)`,
                    }}
                    onPointerDown={(e) => handleWorkspacePointerDown(e, l, "drag")}
                    onDoubleClick={(e) => {
                      if (l.type === "text") {
                        e.stopPropagation();
                        setEditingTextId(l.id);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setContextMenu({
                        visible: true,
                        x: e.clientX,
                        y: e.clientY,
                        layerId: l.id,
                      });
                    }}
                  >
                    {/* Name of layer tag absolute */}
                    {isSelected && (
                      <div className="absolute -top-5 left-0 bg-stone-900 text-white text-[9px] px-1.5 py-0.5 rounded font-mono select-none pointer-events-none whitespace-nowrap">
                        {l.type === "text" ? "TEXT" : l.type === "custom-svg" ? "VECTOR SVG" : l.shapeType ? l.shapeType.toUpperCase() : "IMAGE"}: {Math.round(l.xMm)}x{Math.round(l.yMm)}mm
                      </div>
                    )}

                    {/* Floating Quick Action Overlay Styled Toolbar */}
                    {isSelected && !dragOffset && !resizeDirection && editingTextId !== l.id && (() => {
                      const isCloseToTop = l.yMm < 25;
                      const positionClass = isCloseToTop ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]";
                      return (
                        <div 
                          className={`absolute ${positionClass} left-1/2 bg-stone-900/95 backdrop-blur-md border border-stone-800 text-stone-200 rounded-lg shadow-2xl px-2 py-1.5 flex flex-wrap max-w-[280px] sm:max-w-none items-center gap-2 z-50 pointer-events-auto select-none no-print whitespace-nowrap sm:min-w-max`}
                          style={{
                            transform: `translate(${toolbarOffset.x}px, ${toolbarOffset.y}px) translateX(-50%)`,
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {/* Drag and Move Gripper Handle */}
                          <div 
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-stone-800 rounded flex items-center justify-center text-stone-500 hover:text-stone-300"
                            onPointerDown={handleToolbarDragStart}
                            title="Drag to relocate toolbar"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>

                          {/* 1. Quick Font Section (only for text layers) */}
                          {l.type === "text" && (
                            <div className="relative flex items-center gap-1 border-r border-stone-800 pr-1.5 h-6">
                              <button
                                type="button"
                                onClick={() => setFloatingFontDropdownOpen(!floatingFontDropdownOpen)}
                                className="px-1.5 py-0.5 bg-stone-800 hover:bg-stone-700 text-[10px] font-bold rounded text-amber-400 flex items-center gap-1 select-none cursor-pointer"
                                title="Quick Font Family"
                              >
                                <span>{l.fontFamily || "Outfit"}</span>
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {floatingFontDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-45 cursor-default" onPointerDown={() => setFloatingFontDropdownOpen(false)} />
                                  <div className="absolute left-0 bottom-[calc(100%+8px)] bg-stone-900 border border-stone-800 rounded-lg shadow-2xl py-1 w-36 flex flex-col z-50 text-stone-200">
                                    {[
                                      { value: "Outfit", label: "Outfit" },
                                      { value: "Space Grotesk", label: "Space" },
                                      { value: "Playfair Display", label: "Playfair" },
                                      { value: "Inter", label: "Inter" },
                                      { value: "Cormorant Garamond", label: "Cormorant" },
                                      { value: "JetBrains Mono", label: "JetBrains" },
                                    ].map((font) => (
                                      <button
                                        key={font.value}
                                        type="button"
                                        onClick={() => {
                                          updateCurrentLayers(prev => prev.map(item => item.id === l.id ? { ...item, fontFamily: font.value } : item));
                                          setFloatingFontDropdownOpen(false);
                                        }}
                                        className={`px-2 py-1 text-[10px] text-left hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-between ${l.fontFamily === font.value ? "text-amber-400 font-bold" : "text-stone-300"}`}
                                      >
                                        <span>{font.label}</span>
                                        <span style={{ fontFamily: font.value }} className="text-[10px] text-amber-500 font-bold ml-1">Abc</span>
                                      </button>
                                    ))}
                                  </div>
                                </>
                              )}

                              {/* Text Bold Weight option */}
                              <button
                                type="button"
                                onClick={() => {
                                  const nextWeight = l.fontWeight === "bold" ? "normal" : "bold";
                                  updateCurrentLayers(prev => prev.map(item => item.id === l.id ? { ...item, fontWeight: nextWeight } : item));
                                }}
                                className={`p-1 rounded transition-colors hover:bg-stone-800 cursor-pointer ${l.fontWeight === "bold" ? "text-amber-400 bg-stone-800" : "text-stone-400"}`}
                                title="Toggle Bold Weight"
                              >
                                <Bold className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* 2. Quick Alignment Controls (only for text layers) */}
                          {l.type === "text" && (
                            <div className="flex items-center gap-0.5 border-r border-stone-800 pr-1.5 h-6">
                              <button
                                type="button"
                                onClick={() => updateCurrentLayers(prev => prev.map(item => item.id === l.id ? { ...item, textAlign: "left" } : item))}
                                className={`p-1 rounded transition-colors hover:bg-stone-800 cursor-pointer ${l.textAlign === "left" || !l.textAlign ? "text-amber-400 bg-stone-800" : "text-stone-400"}`}
                                title="Align Left"
                              >
                                <AlignLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCurrentLayers(prev => prev.map(item => item.id === l.id ? { ...item, textAlign: "center" } : item))}
                                className={`p-1 rounded transition-colors hover:bg-stone-800 cursor-pointer ${l.textAlign === "center" ? "text-amber-400 bg-stone-800" : "text-stone-400"}`}
                                title="Align Center"
                              >
                                <AlignCenter className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => updateCurrentLayers(prev => prev.map(item => item.id === l.id ? { ...item, textAlign: "right" } : item))}
                                className={`p-1 rounded transition-colors hover:bg-stone-800 cursor-pointer ${l.textAlign === "right" ? "text-amber-400 bg-stone-800" : "text-stone-400"}`}
                                title="Align Right"
                              >
                                <AlignRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {/* 3. Quick Color Selection circle trigger */}
                          <div className="flex items-center gap-1 border-r border-stone-800 pr-1.5 h-6">
                            <span className="text-[9px] text-stone-500 font-mono tracking-wider uppercase">Ink:</span>
                            <button
                              type="button"
                              onClick={() => {
                                document.getElementById(`floating-color-${l.id}`)?.click();
                              }}
                              style={{ backgroundColor: l.colorHex }}
                              className="w-4 h-4 rounded-full border border-stone-700 hover:scale-110 active:scale-95 cursor-pointer transition-all shadow-inner relative flex items-center justify-center"
                              title="Pick Color"
                            >
                              <span className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                            </button>
                            <input 
                              id={`floating-color-${l.id}`}
                              type="color"
                              value={l.colorHex || "#1E293B"}
                              onChange={(e) => {
                                updateCurrentLayers(prev => prev.map(item => item.id === l.id ? { ...item, colorHex: e.target.value } : item));
                              }}
                              className="sr-only"
                            />
                          </div>

                          {/* 4. Quick Opacity slider block */}
                          <div className="flex items-center gap-1.5 border-r border-stone-800 pr-1.5 h-6">
                            <span className="text-[9px] text-stone-500 font-mono tracking-wider uppercase">Opa:</span>
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={l.opacity !== undefined ? l.opacity : 1}
                              onChange={(e) => {
                                updateCurrentLayers(prev => prev.map(item => item.id === l.id ? { ...item, opacity: parseFloat(e.target.value) } : item));
                              }}
                              className="w-14 accent-amber-500 hover:accent-amber-400 transition-colors h-1 rounded-lg cursor-pointer bg-stone-800"
                              title={`Opacity: ${Math.round((l.opacity !== undefined ? l.opacity : 1) * 100)}%`}
                            />
                            <span className="text-[9px] font-mono text-stone-400 min-w-[20px]">{Math.round((l.opacity !== undefined ? l.opacity : 1) * 100)}%</span>
                          </div>

                          {/* 5. Quick layering z-indexing */}
                          <div className="flex items-center gap-0.5 border-r border-stone-800 pr-1.5 h-6">
                            <button
                              type="button"
                              onClick={() => moveZIndex("up", l.id)}
                              className="p-1 hover:bg-stone-800 text-stone-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                              title="Bring Layer Forward"
                            >
                              <MoveUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveZIndex("down", l.id)}
                              className="p-1 hover:bg-stone-800 text-stone-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                              title="Send Layer Backward"
                            >
                              <MoveDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* 6. Quick Duplicate & Delete operations */}
                          <div className="flex items-center gap-1 h-6 pr-0.5 font-sans">
                            <button
                              type="button"
                              onClick={() => handleDuplicateLayer(l.id)}
                              className="p-1 hover:bg-stone-800 text-stone-400 hover:text-amber-400 rounded transition-colors cursor-pointer"
                              title="Duplicate Layer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLayer(l.id)}
                              className="p-1 hover:bg-stone-800/80 text-stone-400 hover:text-red-400 rounded transition-colors cursor-pointer"
                              title="Delete Layer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      );
                    })()}

                    {/* Direct Inline Text Editing Overlay Box */}
                    {editingTextId === l.id && l.type === "text" && (
                      <textarea
                        style={{
                          fontSize: `${l.fontSizeMm ? l.fontSizeMm * zoomFactor : 16}px`,
                          fontFamily: l.fontFamily || "Outfit",
                          fontWeight: l.fontWeight || "normal",
                          fontStyle: l.fontStyle || "normal",
                          textAlign: l.textAlign || "left",
                          color: l.colorHex,
                          letterSpacing: l.letterSpacingMm ? `${l.letterSpacingMm * zoomFactor}px` : "normal",
                          lineHeight: 1.1,
                        }}
                        className="absolute inset-0 bg-white/95 border border-amber-500 rounded p-1 text-stone-900 focus:outline-none focus:ring-0 z-50 resize-none overflow-hidden"
                        value={l.text || ""}
                        autoFocus
                        onChange={(e) => {
                          const val = e.target.value;
                          updateCurrentLayers(prev => prev.map(item => item.id === l.id ? { ...item, text: val } : item));
                        }}
                        onBlur={() => setEditingTextId(null)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            setEditingTextId(null);
                          } else if (e.key === "Escape") {
                            setEditingTextId(null);
                          }
                        }}
                      />
                    )}

                    {/* Corner crop resize target dots */}
                    {isSelected && !editingTextId && (
                      <>
                        <div 
                          className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-amber-600 rounded-full cursor-nwse-resize"
                          onPointerDown={(e) => handleWorkspacePointerDown(e, l, "resize", "nw")}
                        />
                        <div 
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-amber-600 rounded-full cursor-nesw-resize"
                          onPointerDown={(e) => handleWorkspacePointerDown(e, l, "resize", "ne")}
                        />
                        <div 
                          className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-amber-600 rounded-full cursor-nesw-resize"
                          onPointerDown={(e) => handleWorkspacePointerDown(e, l, "resize", "sw")}
                        />
                        <div 
                          className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-amber-600 rounded-full cursor-nwse-resize"
                          onPointerDown={(e) => handleWorkspacePointerDown(e, l, "resize", "se")}
                        />
                      </>
                    )}
                  </div>
                );
              })}

            </div>
          </div>

          {/* Core high-fidelity studio tab selectors */}
          <div className="w-full max-w-xl mt-6 flex gap-1 bg-stone-200/60 p-1 rounded-xl border border-stone-200/70 no-print">
            <button 
              onClick={() => setActiveTab("workspace" as any)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === "workspace" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Layout className="w-3.5 h-3.5 text-amber-600" />
              <span>Canvas Builder</span>
            </button>
            <button 
              onClick={() => setActiveTab("code" as any)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === "code" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-600" />
              <span>Code Inspector (SVG/HTML)</span>
            </button>
            <button 
              onClick={() => setActiveTab("gallery" as any)}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === "gallery" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
            >
              <Save className="w-3.5 h-3.5 text-amber-600" />
              <span>Saves & Backup ({savedDesigns.length})</span>
            </button>
          </div>

          {/* TAB 1: Canvas Exports List */}
          {activeTab === "workspace" && (
            <div className="w-full max-w-xl bg-white border border-stone-200 rounded-xl p-3.5 mt-4 shadow-sm no-print">
              <h3 className="text-xs font-bold text-stone-700 mb-2 uppercase tracking-wide flex items-center gap-1.5"><FolderDown className="w-4 h-4 text-amber-600" /> Export Print Files</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <button 
                  onClick={() => triggerImageExport("png")}
                  className="py-1.5 px-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PNG (300DPI)</span>
                </button>
                <button 
                  onClick={() => triggerImageExport("webp")}
                  className="py-1.5 px-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>WebP Proof</span>
                </button>
                <button 
                  onClick={() => triggerImageExport("svg")}
                  className="py-1.5 px-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Pure SVG</span>
                </button>
                <button 
                  onClick={triggerHtmlExport}
                  className="py-1.5 px-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs rounded-md font-medium transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Raw HTML</span>
                </button>
                <button 
                  onClick={handleTriggerPrint}
                  className="col-span-2 md:col-span-1 py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-md font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF Print</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Live Code Inspector Panel */}
          {activeTab === "code" && (
            <div className="w-full max-w-xl bg-white border border-stone-200 rounded-xl p-4 mt-4 shadow-sm no-print space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-amber-600" />
                    <span>Raw Exported Vector SVG Code</span>
                  </h4>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generateSvgString());
                      alert("Vector SVG code copied to clipboard!");
                    }}
                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy SVG</span>
                  </button>
                </div>
                <textarea 
                  readOnly 
                  rows={4} 
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded font-mono text-[9px] text-stone-600 focus:outline-none"
                  value={generateSvgString()}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>HTML & Print-Ready CSS Code</span>
                  </h4>
                  <button 
                    onClick={() => {
                      const rawHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Metric Card - ${currentSide}</title>\n  <style>\n    body { background: #fafaf9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }\n    .trim-card { width: ${widthMm}mm; height: ${heightMm}mm; background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.08); position: relative; overflow: hidden; }\n  </style>\n</head>\n<body>\n  <div class="trim-card">\n    ${generateSvgString()}\n  </div>\n</body>\n</html>`;
                      navigator.clipboard.writeText(rawHtml);
                      alert("Print-ready HTML copied to clipboard!");
                    }}
                    className="text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy HTML</span>
                  </button>
                </div>
                <textarea 
                  readOnly 
                  rows={4} 
                  className="w-full p-2 bg-stone-50 border border-stone-200 rounded font-mono text-[9px] text-stone-600 focus:outline-none"
                  value={`<!DOCTYPE html>\n<html lang="en">\n<head>\n  <style>\n    .trim-card { width: ${widthMm}mm; height: ${heightMm}mm; position: relative; overflow: hidden; }\n  </style>\n</head>\n<body>\n  <div class="trim-card">\n    ${generateSvgString()}\n  </div>\n</body>\n</html>`}
                />
              </div>
            </div>
          )}

          {/* TAB 3: LocalStorage Design Directory Catalog & Backups */}
          {activeTab === "gallery" && (
            <div className="w-full max-w-xl bg-white border border-stone-200 rounded-xl p-4 mt-4 shadow-sm no-print space-y-4">
              
              {/* Named Save slot block */}
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200/80 flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-1">Save New Layout Snapshot</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Autumn Corporate Gold" 
                    value={newDesignName}
                    onChange={(e) => setNewDesignName(e.target.value)}
                    className="w-full bg-white text-xs border border-stone-200 p-1.5 rounded focus:border-amber-500 outline-none"
                  />
                </div>
                <button 
                  onClick={() => handleSaveDesign()}
                  className="mt-5 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition-all flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save snapshot</span>
                </button>
              </div>

              {/* JSON export/import controllers */}
              <div className="grid grid-cols-2 gap-3 border-t border-stone-150 pt-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Export Project Files</span>
                  <button 
                    onClick={handleExportJson}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-stone-50 hover:bg-stone-100 text-xs border border-stone-200 rounded text-stone-700"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-600" />
                    <span>Download JSON Template</span>
                  </button>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1">Import Project Files</span>
                  <label className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-stone-50 hover:bg-stone-100 text-xs border border-stone-200 rounded text-stone-700 cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-amber-600" />
                    <span>Upload JSON template</span>
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportJson} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Saved snapshot lists outputs */}
              <div className="border-t border-stone-150 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500 block mb-2">Saved Layout slots list</span>
                
                {savedDesigns.length === 0 ? (
                  <p className="text-xs text-stone-400 italic py-3 text-center">No design snapshots saved. Type a name above to secure your current work.</p>
                ) : (
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                    {savedDesigns.map((d) => (
                      <div 
                        key={d.id}
                        className="flex items-center justify-between p-2 rounded-lg border border-stone-200 bg-stone-50 text-xs"
                      >
                        <div>
                          <p className="font-bold text-stone-800">{d.name}</p>
                          <p className="text-[9px] font-mono text-stone-400 uppercase tracking-widest">Format: {d.preset.toUpperCase()} | Captured at: {d.timestamp}</p>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <button 
                            onClick={() => handleLoadDesign(d.id)}
                            className="bg-amber-100 text-amber-800 hover:bg-amber-200 py-1 px-2 rounded.5 text-[10px] font-bold"
                          >
                            Load
                          </button>
                          <button 
                            onClick={(e) => handleDeleteSavedDesign(d.id, e)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {aiError && (
            <p className="text-[10px] text-red-500 mt-2 font-semibold no-print">⚠️ {aiError}</p>
          )}

        </main>

        {/* --- RIGHT SIDEBAR: Extended Property Editors & Color controllers --- */}
        <aside className={`bg-white border-l border-stone-200/80 flex flex-col transition-all duration-350 no-print overflow-y-auto shrink-0 ${rightMinimised ? "w-12" : "w-72"}`}>
          
          <div className="p-3 border-b border-stone-100 flex items-center justify-between">
            <button 
              onClick={() => setRightMinimised(!rightMinimised)}
              className="p-1 hover:bg-stone-100 rounded text-stone-400 mr-2"
              title="Toggle Properties Sidebar"
            >
              {rightMinimised ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            {!rightMinimised && <h2 className="text-xs font-bold uppercase tracking-wider text-stone-500 mr-auto flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-amber-600" /> Properties Panel</h2>}
          </div>

          {!rightMinimised && (
            <div className="p-4 flex flex-col gap-4">
              
              {selectedLayer ? (
                <div className="space-y-4">
                  
                  {/* Selected indicator heading */}
                  <div className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-200">
                    <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest font-bold">Selected Item ID</span>
                    <span className="text-xs font-bold text-stone-800 text-right font-mono truncate max-w-[130px]">{selectedLayer.id}</span>
                  </div>

                  {/* General geometry controls */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><Ruler className="w-3 h-3 text-amber-600" /> Layer Layout Coordinates</h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">X Position (mm)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={selectedLayer.xMm} 
                          onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, xMm: parseFloat(e.target.value) || 0 } : l))}
                          className="w-full text-xs border border-stone-200 rounded p-1 font-mono focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Y Position (mm)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={selectedLayer.yMm} 
                          onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, yMm: parseFloat(e.target.value) || 0 } : l))}
                          className="w-full text-xs border border-stone-200 rounded p-1 font-mono focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Width (mm)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={selectedLayer.widthMm} 
                          onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, widthMm: Math.max(1, parseFloat(e.target.value)) || 1 } : l))}
                          className="w-full text-xs border border-stone-200 rounded p-1 font-mono focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Height (mm)</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={selectedLayer.heightMm} 
                          onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, heightMm: Math.max(1, parseFloat(e.target.value)) || 1 } : l))}
                          className="w-full text-xs border border-stone-200 rounded p-1 font-mono focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Rotation (deg)</label>
                        <input 
                          type="range" 
                          min="-180" 
                          max="180" 
                          value={selectedLayer.rotation} 
                          onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, rotation: parseInt(e.target.value) || 0 } : l))}
                          className="w-full accent-amber-600"
                        />
                        <span className="text-[9px] font-mono text-stone-400 block text-center">{selectedLayer.rotation}°</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Opacity</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="1" 
                          step="0.1"
                          value={selectedLayer.opacity} 
                          onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, opacity: parseFloat(e.target.value) || 1 } : l))}
                          className="w-full accent-amber-600"
                        />
                        <span className="text-[9px] font-mono text-stone-400 block text-center">{Math.round(selectedLayer.opacity * 100)}%</span>
                      </div>
                    </div>

                  </div>

                  {/* Text-specific typography properties */}
                  {selectedLayer.type === "text" && (
                    <div className="space-y-2 border-t border-stone-100 pt-3">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><Paintbrush className="w-3 h-3 text-amber-600" /> Typography Styles</h4>
                      
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Label Text</label>
                        <textarea 
                          rows={2}
                          value={selectedLayer.text || ""} 
                          onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, text: e.target.value } : l))}
                          className="w-full text-xs border border-stone-200 rounded p-1.5 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div className="relative">
                        <label className="text-[10px] text-stone-500 block mb-0.5">Font Style Family</label>
                        <button
                          type="button"
                          onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                          className="w-full text-xs border border-stone-200 rounded p-1.5 focus:border-amber-500 focus:outline-none bg-white flex items-center justify-between cursor-pointer text-left"
                        >
                          <span className="font-semibold text-stone-800">{selectedLayer.fontFamily || "Outfit"}</span>
                          <span 
                            style={{ fontFamily: selectedLayer.fontFamily || "Outfit" }} 
                            className="text-[11px] px-1.5 py-0.5 bg-stone-50 border border-stone-100 rounded text-amber-600 font-bold tracking-tight"
                          >
                            Abc (Aa)
                          </span>
                        </button>

                        {fontDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setFontDropdownOpen(false)} />
                            <div className="absolute left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 py-1 divide-y divide-stone-50">
                              {[
                                { value: "Outfit", label: "Outfit (Sleek)" },
                                { value: "Space Grotesk", label: "Space Grotesk" },
                                { value: "Playfair Display", label: "Playfair Display" },
                                { value: "Inter", label: "Inter (Clean)" },
                                { value: "Cormorant Garamond", label: "Cormorant (Serif)" },
                                { value: "JetBrains Mono", label: "JetBrains Mono" },
                              ].map((f) => (
                                <button
                                  key={f.value}
                                  type="button"
                                  onClick={() => {
                                    updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, fontFamily: f.value } : l));
                                    setFontDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${selectedLayer.fontFamily === f.value ? "bg-amber-50/50 text-amber-950 font-bold" : "text-stone-700"}`}
                                >
                                  <span>{f.label}</span>
                                  <span 
                                    style={{ fontFamily: f.value }} 
                                    className="text-sm px-2 text-amber-600 font-bold whitespace-nowrap"
                                  >
                                    Abc (Aa)
                                  </span>
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Font Weight</label>
                          <select 
                            value={selectedLayer.fontWeight || "normal"}
                            onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, fontWeight: e.target.value } : l))}
                            className="w-full text-xs border border-stone-200 rounded p-1 focus:border-amber-500 focus:outline-none bg-white"
                          >
                            <option value="100">Thin (100)</option>
                            <option value="200">Extra Light (200)</option>
                            <option value="300">Light (300)</option>
                            <option value="normal">Regular (400)</option>
                            <option value="medium">Medium (500)</option>
                            <option value="600">Semi Bold (600)</option>
                            <option value="bold">Bold (700)</option>
                            <option value="800">Extra Bold (800)</option>
                            <option value="900">Black (900)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5 font-mono">Size (mm)</label>
                          <input 
                            type="number" 
                            step="0.2"
                            min="1.0"
                            value={selectedLayer.fontSizeMm || 2.5} 
                            onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, fontSizeMm: parseFloat(e.target.value) || 2.5 } : l))}
                            className="w-full text-xs border border-stone-200 rounded p-1 focus:border-amber-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-stone-500 block mb-0.5">Letter Spac (mm)</label>
                          <input 
                            type="number" 
                            step="0.05"
                            value={selectedLayer.letterSpacingMm || 0} 
                            onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, letterSpacingMm: parseFloat(e.target.value) || 0 } : l))}
                            className="w-full text-xs border border-stone-200 rounded p-1 focus:border-amber-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <span className="text-[10px] text-stone-500 block mb-1">Alignment</span>
                              <div className="grid grid-cols-3 gap-1 bg-stone-50 p-0.5 rounded border border-stone-200">
                                <button 
                                  onClick={() => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, textAlign: "left" } : l))}
                                  className={`p-1 rounded transition-colors ${selectedLayer.textAlign === "left" ? "bg-white text-amber-600 shadow-sm" : "text-stone-400"}`}
                                  title="Align text Left"
                                >
                                  <AlignLeft className="w-3.5 h-3.5 mx-auto" />
                                </button>
                                <button 
                                  onClick={() => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, textAlign: "center" } : l))}
                                  className={`p-1 rounded transition-colors ${selectedLayer.textAlign === "center" ? "bg-white text-amber-600 shadow-sm" : "text-stone-400"}`}
                                  title="Align text Center"
                                >
                                  <AlignCenter className="w-3.5 h-3.5 mx-auto" />
                                </button>
                                <button 
                                  onClick={() => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, textAlign: "right" } : l))}
                                  className={`p-1 rounded transition-colors ${selectedLayer.textAlign === "right" ? "bg-white text-amber-600 shadow-sm" : "text-stone-400"}`}
                                  title="Align text Right"
                                >
                                  <AlignRight className="w-3.5 h-3.5 mx-auto" />
                                </button>
                              </div>
                            </div>
                            <div>
                              <span className="text-[10px] text-stone-500 block mb-1 text-center">Italic</span>
                              <button
                                onClick={() => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, fontStyle: l.fontStyle === "italic" ? "normal" : "italic" } : l))}
                                className={`p-1.5 border rounded transition-colors flex items-center justify-center ${selectedLayer.fontStyle === "italic" ? "bg-amber-100/50 border-amber-300 text-amber-700 font-bold" : "bg-white border-stone-200 text-stone-400 hover:text-stone-700"}`}
                                title="Toggle Italic Typography Style"
                              >
                                <Italic className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dyn Auto-Fit Text Control module */}
                      <div className="border border-stone-200/60 bg-stone-50/50 rounded-lg p-2.5 mt-1.5 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-stone-700 leading-tight">Auto-Fit Font Size</span>
                            <span className="text-[9px] text-stone-550 leading-tight">Shrinks text width to prevent line overflow</span>
                          </div>
                          <input 
                            type="checkbox"
                            id="autofit-text-toggle"
                            checked={!!selectedLayer.autoFitText}
                            onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, autoFitText: e.target.checked } : l))}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-550 border-stone-300 cursor-pointer accent-amber-500"
                          />
                        </div>
                        {(() => {
                          const fitSize = getRenderFontSizeMm(selectedLayer);
                          const isScaled = !!selectedLayer.autoFitText && fitSize < (selectedLayer.fontSizeMm || 2.5);
                          return isScaled ? (
                            <div className="text-[9px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex items-center justify-between font-mono animate-pulse">
                              <span>Actual fit font size:</span>
                              <strong>{fitSize.toFixed(2)}mm</strong>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Text Stroke (Outline Overlay) module */}
                      <div className="border border-stone-200/60 bg-stone-50/50 rounded-lg p-2.5 mt-1.5 space-y-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block">Text Stroke Outline</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-stone-500 block mb-0.5">Stroke Size (mm)</label>
                            <input 
                              type="number"
                              step="0.05"
                              min="0"
                              max="1.2"
                              value={selectedLayer.strokeWidthMm || 0}
                              onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, strokeWidthMm: parseFloat(e.target.value) || 0 } : l))}
                              className="w-full text-xs border border-stone-200 rounded p-1 focus:border-amber-500 focus:outline-none font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-stone-500 block mb-0.5">Stroke Ink</label>
                            <div className="flex gap-1 items-center">
                              <input 
                                type="color"
                                value={selectedLayer.strokeColor || "#000000"}
                                onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, strokeColor: e.target.value } : l))}
                                className="w-6 h-6 border rounded cursor-pointer p-0 bg-transparent border-stone-200"
                              />
                              <input 
                                type="text"
                                value={selectedLayer.strokeColor || "#000000"}
                                onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, strokeColor: e.target.value } : l))}
                                className="w-full text-[10px] border border-stone-200 rounded p-1 font-mono uppercase bg-white focus:outline-none focus:border-amber-500 text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Image-specific inputs */}
                  {selectedLayer.type === "image" && (
                    <div className="space-y-2 border-t border-stone-100 pt-3">
                      <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Image Source Setting</h4>
                      <div>
                        <label className="text-[10px] text-stone-500 block mb-0.5">Image Base URL / Base64</label>
                        <input 
                           type="text"
                           value={selectedLayer.imageUrl || ""}
                           onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, imageUrl: e.target.value } : l))}
                           className="w-full text-xs border border-stone-200 rounded p-1.5 focus:border-amber-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Shape, Path, and Icon specific features */}
                  {(selectedLayer.type === "shape" || selectedLayer.type === "icon") && (
                    <div className="space-y-4 border-t border-stone-100 pt-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-amber-600" /> Vector Properties
                        </h4>
                        
                        {/* If it's a hand-drawn path, show the "Edit path points" button! */}
                        {selectedLayer.type === "shape" && selectedLayer.shapeType === "path" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (editingPathPointsLayerId === selectedLayer.id) {
                                setEditingPathPointsLayerId(null);
                              } else {
                                setEditingPathPointsLayerId(selectedLayer.id);
                              }
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-colors cursor-pointer ${editingPathPointsLayerId === selectedLayer.id ? "bg-emerald-600 text-white" : "bg-stone-200 text-stone-700 hover:bg-stone-300"}`}
                          >
                            {editingPathPointsLayerId === selectedLayer.id ? "Stop Editing Vector" : "Edit Path Points"}
                          </button>
                        )}
                      </div>

                      {/* Icon fill vs stroke toggle block */}
                      {selectedLayer.type === "icon" && (
                        <div className="flex items-center justify-between p-2 bg-stone-50 border border-stone-200/60 rounded-md">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-stone-700 leading-none">Fill Icon Shape</span>
                            <span className="text-[9px] text-stone-400 font-mono mt-0.5">Fills the interior solid</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={!!selectedLayer.iconFill}
                            onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, iconFill: e.target.checked } : l))}
                            className="w-4 h-4 rounded text-amber-600 accent-amber-500 cursor-pointer"
                          />
                        </div>
                      )}

                      {/* Gradient controls module */}
                      <div className="border border-stone-200/60 bg-stone-50/50 rounded-lg p-2.5 space-y-2">
                        <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">Paint Gradients</span>
                        
                        <div>
                          <label className="text-[9px] text-stone-500 block mb-0.5">Gradient Type</label>
                          <select
                            value={selectedLayer.gradientType || "none"}
                            onChange={(e) => {
                              const v = e.target.value as any;
                              updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { 
                                ...l, 
                                gradientType: v,
                                // Provide default nice starter colors if not already defined
                                gradientStartColor: l.gradientStartColor || l.colorHex || "#EA580C",
                                gradientEndColor: l.gradientEndColor || "#FCD34D",
                                gradientAngle: l.gradientAngle ?? 90
                              } : l));
                            }}
                            className="w-full text-xs border border-stone-200 rounded p-1 focus:border-amber-500 focus:outline-none bg-white font-serif"
                          >
                            <option value="none">Flat Solid Color (No Gradient)</option>
                            <option value="linear">Linear Gradient (Straight Directional)</option>
                            <option value="radial">Radial Gradient (Central Circular)</option>
                          </select>
                        </div>

                        {selectedLayer.gradientType && selectedLayer.gradientType !== "none" && (
                          <div className="space-y-2 pt-1 border-t border-stone-200/40">
                            
                            {/* Linear Gradient Angle configuration slider */}
                            {selectedLayer.gradientType === "linear" && (
                              <div>
                                <div className="flex justify-between items-center mb-0.5">
                                  <label className="text-[9px] text-stone-500">Angle Direction</label>
                                  <span className="text-[9px] font-mono text-stone-400">{selectedLayer.gradientAngle ?? 90}°</span>
                                </div>
                                <input 
                                  type="range" 
                                  min="0" 
                                  max="360" 
                                  step="5"
                                  value={selectedLayer.gradientAngle ?? 90} 
                                  onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, gradientAngle: parseInt(e.target.value) || 0 } : l))}
                                  className="w-full accent-amber-600"
                                />
                              </div>
                            )}

                            {/* Two-step color definitions picker inputs */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-stone-500 block">Start Color</label>
                                <div className="flex gap-1 items-center">
                                  <input 
                                    type="color"
                                    value={selectedLayer.gradientStartColor || "#000000"}
                                    onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, gradientStartColor: e.target.value } : l))}
                                    className="w-5 h-5 border rounded cursor-pointer p-0 bg-transparent border-stone-200"
                                  />
                                  <input 
                                    type="text"
                                    value={selectedLayer.gradientStartColor || "#000000"}
                                    onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, gradientStartColor: e.target.value } : l))}
                                    className="w-full text-[9px] border border-stone-200 rounded p-0.5 font-mono uppercase bg-white focus:outline-none focus:border-amber-500 text-center"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] text-stone-500 block">End Color</label>
                                <div className="flex gap-1 items-center">
                                  <input 
                                    type="color"
                                    value={selectedLayer.gradientEndColor || "#000000"}
                                    onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, gradientEndColor: e.target.value } : l))}
                                    className="w-5 h-5 border rounded cursor-pointer p-0 bg-transparent border-stone-200"
                                  />
                                  <input 
                                    type="text"
                                    value={selectedLayer.gradientEndColor || "#000000"}
                                    onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, gradientEndColor: e.target.value } : l))}
                                    className="w-full text-[9px] border border-stone-200 rounded p-0.5 font-mono uppercase bg-white focus:outline-none focus:border-amber-500 text-center"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Vector Outline Stroke module */}
                      <div className="border border-stone-200/60 bg-stone-50/50 rounded-lg p-2.5 space-y-2">
                        <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wider">Vector Outline / Line Size</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-stone-500 block mb-0.5">Size (mm)</label>
                            <input 
                              type="number"
                              step="0.05"
                              min="0"
                              max="3"
                              value={selectedLayer.strokeWidthMm || 0}
                              onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, strokeWidthMm: parseFloat(e.target.value) || 0 } : l))}
                              className="w-full text-xs border border-stone-200 rounded p-1 focus:border-amber-500 focus:outline-none font-mono bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-stone-500 block mb-0.5">Outline Color</label>
                            <div className="flex gap-1 items-center">
                              <input 
                                type="color"
                                value={selectedLayer.strokeColor || "#000000"}
                                onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, strokeColor: e.target.value } : l))}
                                className="w-5 h-5 border rounded cursor-pointer p-0 bg-transparent border-stone-200"
                              />
                              <input 
                                type="text"
                                value={selectedLayer.strokeColor || "#000000"}
                                onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, strokeColor: e.target.value } : l))}
                                className="w-full text-[9px] border border-stone-200 rounded p-0.5 font-mono uppercase bg-white focus:outline-none focus:border-amber-500 text-center"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* PRINT CMYK COLOR CALIBRATOR SIMULATOR */}
                  <div className="space-y-2 border-t border-stone-100 pt-3">
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1"><Palette className="w-3.5 h-3.5 text-amber-600" /> Print Color Calibrator</h4>
                    
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-8 h-8 rounded border border-stone-300 shadow-sm shrink-0" 
                        style={{ backgroundColor: selectedLayer.colorHex }}
                      />
                      <div className="flex-1">
                        <label className="text-[9px] text-stone-400 uppercase block tracking-wider">HEX Code (Screen Color)</label>
                        <input 
                          type="text"
                          value={selectedLayer.colorHex}
                          onChange={(e) => updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, colorHex: e.target.value } : l))}
                          className="w-full text-xs border border-stone-200 rounded px-1.5 py-0.5 font-mono focus:border-amber-500 focus:outline-none uppercase"
                        />
                      </div>
                    </div>

                    {/* Displays calculated CMYK parameters for physical printing ink matching */}
                    <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-stone-400 font-bold mb-1 uppercase tracking-wider text-[9px]">
                        <span>CMYK ink Simulation</span>
                        <span className="text-stone-600">Print separation output</span>
                      </div>
                      
                      <div className="space-y-1 font-mono">
                        {/* Cyan */}
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-500 font-bold">C: {hexToCmyk(selectedLayer.colorHex).c}%</span>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            className="w-24 h-1.5 accent-cyan-500"
                            value={hexToCmyk(selectedLayer.colorHex).c}
                            onChange={(e) => {
                              const cmyk = hexToCmyk(selectedLayer.colorHex);
                              const parsedHex = cmykToHex(parseInt(e.target.value), cmyk.m, cmyk.y, cmyk.k);
                              updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, colorHex: parsedHex } : l));
                            }}
                          />
                        </div>
                        {/* Magenta */}
                        <div className="flex items-center justify-between">
                          <span className="text-fuchsia-500 font-bold">M: {hexToCmyk(selectedLayer.colorHex).m}%</span>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            className="w-24 h-1.5 accent-fuchsia-500"
                            value={hexToCmyk(selectedLayer.colorHex).m}
                            onChange={(e) => {
                              const cmyk = hexToCmyk(selectedLayer.colorHex);
                              const parsedHex = cmykToHex(cmyk.c, parseInt(e.target.value), cmyk.y, cmyk.k);
                              updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, colorHex: parsedHex } : l));
                            }}
                          />
                        </div>
                        {/* Yellow */}
                        <div className="flex items-center justify-between">
                          <span className="text-amber-500 font-bold">Y: {hexToCmyk(selectedLayer.colorHex).y}%</span>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            className="w-24 h-1.5 accent-amber-500"
                            value={hexToCmyk(selectedLayer.colorHex).y}
                            onChange={(e) => {
                              const cmyk = hexToCmyk(selectedLayer.colorHex);
                              const parsedHex = cmykToHex(cmyk.c, cmyk.m, parseInt(e.target.value), cmyk.k);
                              updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, colorHex: parsedHex } : l));
                            }}
                          />
                        </div>
                        {/* Black (Key) */}
                        <div className="flex items-center justify-between">
                          <span className="text-stone-700 font-bold">K: {hexToCmyk(selectedLayer.colorHex).k}%</span>
                          <input 
                            type="range"
                            min="0"
                            max="100"
                            className="w-24 h-1.5 accent-stone-700"
                            value={hexToCmyk(selectedLayer.colorHex).k}
                            onChange={(e) => {
                              const cmyk = hexToCmyk(selectedLayer.colorHex);
                              const parsedHex = cmykToHex(cmyk.c, cmyk.m, cmyk.y, parseInt(e.target.value));
                              updateCurrentLayers(prev => prev.map(l => l.id === selectedLayer.id ? { ...l, colorHex: parsedHex } : l));
                            }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Alignment utilities */}
                  <div className="space-y-2 border-t border-stone-100 pt-3">
                    <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Alignment helpers</h4>
                    <div className="grid grid-cols-3 gap-1">
                      <button 
                        onClick={() => alignLayer("left")}
                        className="py-1 px-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-[10px] text-stone-600 font-medium"
                      >
                        Left Bound
                      </button>
                      <button 
                        onClick={() => alignLayer("center")}
                        className="py-1 px-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-[10px] text-stone-600 font-medium"
                      >
                        Horiz Ctr
                      </button>
                      <button 
                        onClick={() => alignLayer("right")}
                        className="py-1 px-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-[10px] text-stone-600 font-medium"
                      >
                        Right Bound
                      </button>
                      <button 
                        onClick={() => alignLayer("top")}
                        className="py-1 px-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-[10px] text-stone-600 font-medium"
                      >
                        Top Limit
                      </button>
                      <button 
                        onClick={() => alignLayer("middle")}
                        className="py-1 px-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-[10px] text-stone-600 font-medium"
                      >
                        Vert Ctr
                      </button>
                      <button 
                        onClick={() => alignLayer("bottom")}
                        className="py-1 px-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded text-[10px] text-stone-600 font-medium"
                      >
                        Bottom Limit
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-4 bg-stone-50 border border-dashed border-stone-200 rounded-lg text-center text-stone-400 text-xs">
                  <Sliders className="w-6 h-6 mx-auto mb-1 opacity-40 text-stone-500" />
                  <span>Select a layer to adjust text, position, size and print ink separation.</span>
                </div>
              )}

            </div>
          )}
        </aside>

      </div>

      {/* Dynamic Floating High-contrast Context Menu */}
      {contextMenu.visible && (
        <div 
          className="fixed bg-stone-900 border border-stone-700/80 rounded-xl shadow-2xl p-1.5 w-56 z-50 animate-in fade-in zoom-in-95 duration-100 no-print flex flex-col gap-0.5 text-stone-200"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.layerId ? (
            <>
              <div className="px-2.5 py-1 text-[10px] text-stone-400 font-bold uppercase tracking-widest border-b border-stone-800 mb-1">
                Layer Operations
              </div>
              <button 
                onClick={() => { handleDuplicateLayer(contextMenu.layerId!); setContextMenu(prev => ({ ...prev, visible: false })); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-stone-800 rounded-md transition-colors text-left w-full cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-500" />
                <span>Duplicate Layer</span>
              </button>
              <button 
                onClick={() => { moveZIndex("up", contextMenu.layerId!); setContextMenu(prev => ({ ...prev, visible: false })); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-stone-800 rounded-md transition-colors text-left w-full cursor-pointer"
              >
                <MoveUp className="w-3.5 h-3.5 text-amber-500" />
                <span>Bring Upward</span>
              </button>
              <button 
                onClick={() => { moveZIndex("down", contextMenu.layerId!); setContextMenu(prev => ({ ...prev, visible: false })); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-stone-800 rounded-md transition-colors text-left w-full cursor-pointer"
              >
                <MoveDown className="w-3.5 h-3.5 text-amber-500" />
                <span>Send Downward</span>
              </button>
              
              <div className="border-t border-stone-800/80 my-1"></div>
              
              <button 
                onClick={() => { handleDeleteLayer(contextMenu.layerId!); setContextMenu(prev => ({ ...prev, visible: false })); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-950/40 rounded-md transition-colors text-left w-full cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Delete Layer</span>
              </button>
            </>
          ) : (
            <>
              <div className="px-2.5 py-1 text-[10px] text-stone-400 font-bold uppercase tracking-widest border-b border-stone-800 mb-1">
                Insert Raw Elements
              </div>
              <button 
                onClick={() => { addTextLayer(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-stone-800 rounded-md transition-colors text-left w-full cursor-pointer"
              >
                <TypeIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Insert text box</span>
              </button>
              <button 
                onClick={() => { addShapeLayer("logo-badge"); setContextMenu(prev => ({ ...prev, visible: false })); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-stone-800 rounded-md transition-colors text-left w-full cursor-pointer"
              >
                <SparkleIcon className="w-3.5 h-3.5 text-amber-500" />
                <span>Insert Crest Shape</span>
              </button>
              <button 
                onClick={() => { addCustomSvgLayer(); setContextMenu(prev => ({ ...prev, visible: false })); }}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs hover:bg-stone-800 rounded-md transition-colors text-left w-full cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-500" />
                <span>Insert Custom SVG Layer</span>
              </button>
              
              <div className="border-t border-stone-800 my-1" />
              <div className="px-2 py-1 text-[9px] text-center text-stone-500 font-mono select-none">
                Right-click elements to edit
              </div>
            </>
          )}
        </div>
      )}

      {/* 3. HIGH FIDELITY PRINTABLE PAGE: Rendered only during browser printing (no-print hides everything else) */}
      <div className="hidden print-only bg-white text-black p-0 m-0">
        
        {/* Page Container */}
        <div className="p-8 space-y-12 max-w-[210mm] mx-auto">
          
          {/* Header Metadata block detailing print job specs */}
          <div className="border-b-2 border-dashed border-stone-300 pb-4 flex justify-between items-start text-xs uppercase font-mono">
            <div>
              <span className="font-bold text-base tracking-wider block text-black">METRIC STUDIO - HIGH RES PRESS SHEET</span>
              <span className="block mt-0.5">Preset Format: {selectedPreset.toUpperCase()} Standard ({widthMm} × {heightMm} mm)</span>
              <span className="block">DPI Equivalent: Vector output (infinite quality)</span>
            </div>
            <div className="text-right">
              <span className="block font-bold">CMYK CALIBRATION ENABLED</span>
              <span className="block mt-0.5">Bleed boundary: +3.0mm added</span>
              <span className="block">Cut corner radius: {roundedCorners ? "Round 3.2mm die" : "Straight edge 90 deg"}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-20 justify-items-center pt-8">
            
            {/* FRONT SIDE print outline with crop handles & registration color target matrix */}
            <div className="relative">
              
              {/* Printers Color Target Calibration Bars */}
              <div className="absolute -top-12 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
                <span className="w-5 h-2.5 bg-cyan-500 block text-[7px] text-center text-white select-none">C</span>
                <span className="w-5 h-2.5 bg-fuchsia-500 block text-[7px] text-center text-white select-none">M</span>
                <span className="w-5 h-2.5 bg-amber-500 block text-[7px] text-center text-white select-none">Y</span>
                <span className="w-5 h-2.5 bg-black block text-[7px] text-center text-white select-none">K</span>
                <span className="w-5 h-2.5 bg-[#1E293B] block text-[7px] text-center text-white select-none">REG</span>
                <span className="text-[10px] ml-4 font-mono font-bold text-black border-l border-stone-400 pl-3">FRONT / FACE VIEW</span>
              </div>

              {/* Offset Corner Cut Crosshair Cropmarks */}
              {/* Top-Left Cropmark */}
              <div className="absolute -top-6 -left-6 w-8 h-8 pointer-events-none border-r border-b border-black md:scale-100 z-20" />
              {/* Top-Right Cropmark */}
              <div className="absolute -top-6 -right-6 w-8 h-8 pointer-events-none border-l border-b border-black z-20" />
              {/* Bottom-Left Cropmark */}
              <div className="absolute -bottom-6 -left-6 w-8 h-8 pointer-events-none border-r border-t border-black z-20" />
              {/* Bottom-Right Cropmark */}
              <div className="absolute -bottom-6 -right-6 w-8 h-8 pointer-events-none border-l border-t border-black z-20" />

              {/* Card wrapper incorporating bleed margin pixels */}
              <div 
                className="bg-white border-2 border-stone-200 relative"
                style={{
                  width: `${(widthMm + bleedDistanceMm * 2) * 5}px`,
                  height: `${(heightMm + bleedDistanceMm * 2) * 5}px`,
                }}
              >
                {/* Visual card boundary */}
                <div 
                  className={`absolute bg-white overflow-hidden ${roundedCorners ? "rounded-[12px]" : "rounded-none"}`}
                  style={{
                    top: `${bleedDistanceMm * 5}px`,
                    left: `${bleedDistanceMm * 5}px`,
                    width: `${widthMm * 5}px`,
                    height: `${heightMm * 5}px`,
                  }}
                  dangerouslySetInnerHTML={{ __html: generateSvgString("front") }}
                />
              </div>

              {/* Card cut margin tag specs */}
              <span className="absolute -bottom-6 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-wider text-black">
                [ Trim dimensions: {widthMm}mm × {heightMm}mm | cut along cropmarks ]
              </span>
            </div>

            {/* BACK SIDE print setup */}
            <div className="relative pt-6">
              
              {/* Printers Color Target Calibration Bars */}
              <div className="absolute -top-6 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
                <span className="w-5 h-2.5 bg-cyan-500 block text-[7px] text-sm text-center text-white select-none">C</span>
                <span className="w-5 h-2.5 bg-fuchsia-500 block text-[7px] text-sm text-center text-white select-none">M</span>
                <span className="w-5 h-2.5 bg-amber-500 block text-[7px] text-sm text-center text-white select-none">Y</span>
                <span className="w-5 h-2.5 bg-black block text-[7px] text-sm text-center text-white select-none">K</span>
                <span className="w-5 h-2.5 bg-[#1E293B] block text-[7px] text-sm text-center text-white select-none">REG</span>
                <span className="text-[10px] ml-4 font-mono font-bold text-black border-l border-stone-400 pl-3">BACK / REVERSE VIEW</span>
              </div>

              {/* Offset Corner Cut Crosshair Cropmarks */}
              <div className="absolute -top-0 -left-6 w-8 h-8 pointer-events-none border-r border-b border-black z-20" />
              <div className="absolute -top-0 -right-6 w-8 h-8 pointer-events-none border-l border-b border-black z-20" />
              <div className="absolute -bottom-12 -left-6 w-8 h-8 pointer-events-none border-r border-t border-black z-20" />
              <div className="absolute -bottom-12 -right-6 w-8 h-8 pointer-events-none border-l border-t border-black z-20" />

              {/* Card wrapper incorporating bleed margin pixels */}
              <div 
                className="bg-white border-2 border-stone-200 relative"
                style={{
                  width: `${(widthMm + bleedDistanceMm * 2) * 5}px`,
                  height: `${(heightMm + bleedDistanceMm * 2) * 5}px`,
                }}
              >
                {/* Visual card boundary */}
                <div 
                  className={`absolute bg-white overflow-hidden ${roundedCorners ? "rounded-[12px]" : "rounded-none"}`}
                  style={{
                    top: `${bleedDistanceMm * 5}px`,
                    left: `${bleedDistanceMm * 5}px`,
                    width: `${widthMm * 5}px`,
                    height: `${heightMm * 5}px`,
                  }}
                  dangerouslySetInnerHTML={{ __html: generateSvgString("back") }}
                />
              </div>

              {/* Card cut margin tag specs */}
              <span className="absolute -bottom-12 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-wider text-black">
                [ Reverse trim: {widthMm}mm × {heightMm}mm | registration targets match face ]
              </span>
            </div>

          </div>

          <div className="pt-16 text-center text-[10px] font-mono text-stone-400 border-t border-stone-200">
            METRIC STUDIO DIGITAL PRESS SUITE &copy; 2026. ALL SEPARATIONS SECURED.
          </div>

        </div>

      </div>

    </div>
  );
}
