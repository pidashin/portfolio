import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const { name, description, image } = await req.json();

    if (!description && !image) {
      return NextResponse.json({ error: "Description or Image is required" }, { status: 400 });
    }

    let finalPrompt = "";

    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const analysisPrompt = `
        Analyze this photo and create a detailed Shonen Manga character design prompt for a person named ${name}.
        Keep the character's facial features, hairstyle, and clothing style consistent with the photo but reimaged in manga style.
        User's extra context: "${description || "None"}"
        
        Requirements for the prompt you generate:
        - It must start with: "A high-quality vibrant COLOR Shonen manga character portrait, ${name},"
        - Include details about hair, eyes, expression, and outfit based on the photo.
        - Ends with: "dynamic cell shading, clean line art, high contrast, white background, masterpiece, trending on pixiv."
        
        Return ONLY the prompt string. No other text.
      `;

      const analysisResult = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: analysisPrompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }
            ]
          }
        ]
      });
      
      finalPrompt = analysisResult.text?.trim() || "";
    } else {
      finalPrompt = `A high-quality vibrant COLOR Shonen manga character portrait, ${name}, ${description}, dynamic cell shading, clean line art, high contrast, white background, masterpiece, trending on pixiv.`;
    }

    // Image generation Stage
    // We use the imagen-3.0-generate-001 as the target model
    const imageResult = await client.models.generateImages({
      model: "imagen-3.0-generate-001",
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        includeRaiReason: true
      }
    });

    const imageData = imageResult.generatedImages?.[0]?.image?.imageBytes;
    if (imageData) {
      return NextResponse.json({ 
        avatarUrl: `data:image/png;base64,${imageData}`,
        promptUsed: finalPrompt
      });
    }

    throw new Error("Gemini returned no image data");

  } catch (error: any) {
    console.error("LifeStrip Avatar Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
