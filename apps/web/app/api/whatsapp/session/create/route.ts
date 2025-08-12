import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@kit/supabase/server';
import { requireUser } from '@kit/supabase/require-user';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    
    const { sessionName } = await request.json();

    if (!sessionName) {
      return NextResponse.json(
        { error: 'Session name is required' },
        { status: 400 }
      );
    }

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('whatsapp_sessions')
      .select('id')
      .eq('account_id', user.id)
      .eq('session_name', sessionName)
      .single();

    if (existingSession) {
      return NextResponse.json(
        { error: 'Session with this name already exists' },
        { status: 409 }
      );
    }

    // Create new session
    const { data: session, error } = await supabase
      .from('whatsapp_sessions')
      .insert({
        account_id: user.id,
        session_name: sessionName,
        status: 'disconnected'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating WhatsApp session:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in create session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
