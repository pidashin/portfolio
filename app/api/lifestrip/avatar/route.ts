import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  vertexai: false,
});

export async function POST(req: NextRequest) {
  try {
    const { name, description, image } = await req.json();

    if (!description && !image) {
      return NextResponse.json(
        { error: 'Description or Image is required' },
        { status: 400 },
      );
    }

    const contents = [];
    let prompt = '';

    if (image) {
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      prompt = `Transform the person in this photo into a vibrant COLOR Shonen Manga character portrait named "${name}".
      Consistency: Keep their hairstyle and facial features consistent with the photo.
      Extra context: ${description || 'None'}
      Style: Dynamic cell shading, clean line art, high contrast, white background.
      Output: Generate the image directly.`;

      contents.push({
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ],
      });
    } else {
      prompt = `Generate a vibrant COLOR Shonen Manga character portrait named "${name}".
      Description: ${description}
      Style: Dynamic cell shading, clean line art, high contrast, white background.
      Output: Generate the image directly.`;

      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });
    }

    const result = await client.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
    });

    // Extract image data from the response parts
    const imagePart = result.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData,
    );

    if (imagePart?.inlineData?.data) {
      return NextResponse.json({
        avatarUrl: `data:${imagePart.inlineData.mimeType || 'image/png'};base64,${imagePart.inlineData.data}`,
        promptUsed: prompt,
      });
    }

    console.error(
      "Gemini didn't return an image part. Result:",
      JSON.stringify(result, null, 2),
    );
    throw new Error(
      'Gemini failed to generate an image. It might have returned text instead.',
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('LifeStrip Avatar Error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
