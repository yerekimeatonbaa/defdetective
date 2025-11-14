import { genkit } from 'genkit';
import { NextRequest, NextResponse } from 'next/server';
import '@/ai/prompts';
import '@/ai/flows/smart-word-hints';

export async function POST(request: NextRequest) {
  try {
    const { path, body } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Missing `path` parameter.' }, { status: 400 });
    }

    const result = await genkit.run(path, body ?? {});
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('🔥 Error running Genkit flow:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
