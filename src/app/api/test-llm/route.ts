// D:\AI\llm-studio\src\app\api\test-llm\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { testAPIConnection } from '@/ai/flows/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, config } = body;

    // Basic validation
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Test the connection
    const result = await testAPIConnection(config);

    return NextResponse.json(result, {
      status: result.success ? 200 : 500
    });

  } catch (error) {
    console.error('Test API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}