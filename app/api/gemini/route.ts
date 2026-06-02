import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { prompt, businessType = "Corporate" } = await req.json();

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate a high-end printable business card configuration. Business niche/concept: "${prompt}". Business Type: "${businessType}". 
Provide corporate placeholder names, professional typography selections from: Outfit, Space Grotesk, Playfair Display, Inter, Cormorant Garamond, JetBrains Mono.
Specify positions in terms of proportional millimeter dimensions offset from top-left (assume standard card dimensions are 85mm x 55mm).
Front of card usually carries Name, Designation, and contact details, or minimalist logo.
Back of card usually carries a powerful company title, elegant centered slogan/logo, or abstract design elements.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            themeName: { type: Type.STRING },
            primaryColor: { type: Type.STRING, description: "Card background HEX color, e.g. #0F172A or #FBFBFB" },
            secondaryColor: { type: Type.STRING, description: "Accent HEX color, e.g. #B45309" },
            textColor: { type: Type.STRING, description: "Default font HEX color, e.g. #1E293B or #FFFFFF" },
            fontFamily: { type: Type.STRING, description: "Choose EXACTLY from: Inter, Space Grotesk, Playfair Display, JetBrains Mono, Outfit, Cormorant Garamond" },
            logoText: { type: Type.STRING, description: "A simple luxury single-word brand initials or abstract acronym, e.g., 'ELITE' or 'SV'" },
            frontLayers: {
              type: Type.ARRAY,
              description: "Pragmatic text layers to populate on the Face / Front side of the card",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  fontSizeMm: { type: Type.NUMBER, description: "Text height in standard millimeters. Recommended name 4.5mm, titles 3mm, contact details 2.2mm" },
                  xMm: { type: Type.NUMBER, description: "X coordinate position in mm from 10 to 75" },
                  yMm: { type: Type.NUMBER, description: "Y coordinate position in mm from 8 to 48" },
                  fontWeight: { type: Type.STRING, description: "normal or bold" },
                  textAlign: { type: Type.STRING, description: "left, center, or right" },
                  letterSpacingMm: { type: Type.NUMBER, description: "tracking distance, e.g., 0.1 or 0.5" }
                },
                required: ["id", "text", "fontSizeMm", "xMm", "yMm", "fontWeight", "textAlign"]
              }
            },
            backLayers: {
              type: Type.ARRAY,
              description: "Pragmatic text layers for the Back of the card",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  fontSizeMm: { type: Type.NUMBER },
                  xMm: { type: Type.NUMBER },
                  yMm: { type: Type.NUMBER },
                  fontWeight: { type: Type.STRING },
                  textAlign: { type: Type.STRING },
                  letterSpacingMm: { type: Type.NUMBER }
                },
                required: ["id", "text", "fontSizeMm", "xMm", "yMm", "fontWeight", "textAlign"]
              }
            }
          },
          required: ["themeName", "primaryColor", "secondaryColor", "textColor", "fontFamily", "logoText", "frontLayers", "backLayers"]
        }
      }
    });

    const text = result.text;
    if (!text) {
      throw new Error("No suggestion text received from Gemini server.");
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err: any) {
    console.error("Gemini Route handler error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
