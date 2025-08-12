import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@kit/supabase/server';
import { requireUser } from '@kit/supabase/require-user';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      // Get specific session
      const { data: session, error } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('account_id', user.id)
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ session });
    } else {
      // Get all sessions for user
      const { data: sessions, error } = await supabase
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

      return NextResponse.json({ sessions });
    }
  } catch (error) {
    console.error('Error in session status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const user = await requireUser(supabase);
    
    const { sessionId, status, phoneNumber, qrCode } = await request.json();

    if (!sessionId || !status) {
      return NextResponse.json(
        { error: 'Session ID and status are required' },
        { status: 400 }
      );
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (phoneNumber) updateData.phone_number = phoneNumber;
    if (qrCode) updateData.qr_code = qrCode;
    if (status === 'connected') updateData.last_connected_at = new Date().toISOString();

    const { data: session, error } = await supabase
      .from('whatsapp_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('account_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating WhatsApp session:', error);
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in update session API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
