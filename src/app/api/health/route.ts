import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'API is working',
    env: {
      hasDeepseekKey: !!process.env.DEEPSEEK_API_KEY,
      hasKimiKey: !!process.env.KIMI_API_KEY,
    }
  });
}
