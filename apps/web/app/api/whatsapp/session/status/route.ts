import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const userResult = await requireUser(client);

    // Check if authentication failed
    if (userResult.error) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = userResult.data;

    // Get all WhatsApp sessions for the current user
    const { data: sessions, error } = await client
      .from('whatsapp_sessions')
      .select('*')
      .eq('account_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching WhatsApp sessions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error in WhatsApp session status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
