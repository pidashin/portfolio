import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
// Note: Requires GEMINI_API_KEY in .env.local
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { diaryText, members } = await req.json();

    if (!diaryText) {
      return NextResponse.json({ error: "Diary text is required" }, { status: 400 });
    }

    // 1. Storyboard Stage (Gemini 1.5 Flash)
    // Translates Traditional Chinese diary into 4 sequential English panel prompts
    const storyModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const familyContext = members && members.length > 0 
      ? members.map((m: any) => `${m.name} (${m.description})`).join(", ")
      : "A default Shonen Manga protagonist";
    
    const storyPrompt = `
      You are a professional Japanese Shonen Manga storyboarder. 
      Convert the following Traditional Chinese diary entry into 4 sequential manga panel descriptions for an image generation AI.
      
      Diary Entry: ${diaryText}
      Family Members Available: ${familyContext}
      
      Requirements for each panel:
      - Aesthetic: Vibrant COLOR Japanese Shonen Manga style.
      - Theme: Humorous, exaggerated expressions (funny faces), high energy, lively.
      - Standard: "A high-quality vibrant COLOR Shonen manga panel, [Detailed Subject/Action], [Exaggerated Funny Expression], Traditional Chinese (繁體中文) on-screen sound effects, dynamic cell shading, clean line art."
      - Consistency: Refer to the family member descriptions accurately.
      
      Format: Return ONLY a valid JSON array of 4 strings. No markdown, no explanations.
    `;

    const storyResult = await storyModel.generateContent(storyPrompt);
    const storyResponse = await storyResult.response;
    const storyText = storyResponse.text();
    
    // Parse prompts
    let panelPrompts: string[];
    try {
      const cleaned = storyText.replace(/```json|```/g, "").trim();
      panelPrompts = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse storyboard JSON:", storyText);
      throw new Error("Failed to generate storyboard. Try a different diary entry.");
    }

    // 2. Ink & Color Stage (Nano Banana / Imagen 3)
    // We use the Imagen 3 model via the Generative AI SDK
    const imageModel = genAI.getGenerativeModel({ model: "imagen-3.0-generate-002" });

    // Note: Generating 4 high-quality images sequentially can take time.
    // For a better UX in production, consider Parallel processing or per-panel polling.
    // For this MVP, we'll generate all 4.
    
    const panelUrls = await Promise.all(panelPrompts.map(async (p) => {
      try {
        const imageResult = await imageModel.generateContent(p);
        const imageResponse = await imageResult.response;
        // In the real SDK, imageResponse.candidates[0].content.parts[0].inlineData.data contains base64
        // We'll return the base64 or a temporary URL if hosted.
        // For simplicity in this demo, we'll return a mock URL if generation fails or base64 if it succeeds.
        const imageData = imageResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (imageData) {
          return `data:image/png;base64,${imageData}`;
        }
        return `https://via.placeholder.com/600x600?text=Generation+Failed`;
      } catch (err) {
        console.error("Image Gen Error for panel:", p, err);
        return `https://via.placeholder.com/600x600?text=Error`;
      }
    }));

    return NextResponse.json({ panels: panelUrls });

  } catch (error: any) {
    console.error("LifeStrip Orchestration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
