import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
// Note: Requires GEMINI_API_KEY in .env.local
const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  vertexai: false,
});

interface FamilyMember {
  name: string;
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    const { diaryText, members } = await req.json();

    if (!diaryText) {
      return NextResponse.json(
        { error: 'Diary text is required' },
        { status: 400 },
      );
    }

    // 1. Storyboard Stage (Gemini 2.5 Flash)
    // Translates Traditional Chinese diary into 4 sequential English panel prompts
    const familyContext =
      members && members.length > 0
        ? members
            .map((m: FamilyMember) => `${m.name} (${m.description})`)
            .join(', ')
        : 'A default Shonen Manga protagonist';

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

    const storyResult = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: storyPrompt }] }],
    });
    const storyText = storyResult.text || '';

    // Parse prompts
    let panelPrompts: string[];
    try {
      const cleaned = storyText.replace(/```json|```/g, '').trim();
      panelPrompts = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('Failed to parse storyboard JSON:', storyText, parseErr);
      throw new Error(
        'Failed to generate storyboard. Try a different diary entry.',
      );
    }

    // 2. Ink & Color Stage (Imagen 3)
    // We use the Imagen 3 model via the Generative AI SDK
    const panelUrls = await Promise.all(
      panelPrompts.map(async (p) => {
        try {
          const imageResult = await client.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: p,
            config: {
              numberOfImages: 1,
              includeRaiReason: true,
            },
          });
          const imageData = imageResult.generatedImages?.[0]?.image?.imageBytes;
          if (imageData) {
            return `data:image/png;base64,${imageData}`;
          }
          return `https://via.placeholder.com/600x600?text=Generation+Failed`;
        } catch (err) {
          console.error('Image Gen Error for panel:', p, err);
          return `https://via.placeholder.com/600x600?text=Error`;
        }
      }),
    );

    return NextResponse.json({ panels: panelUrls });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('LifeStrip Orchestration Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
