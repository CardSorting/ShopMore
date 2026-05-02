import { NextResponse } from 'next/server';
import { ticketRepository } from '@infrastructure/repositories/ticketRepository';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const ticketId = crypto.randomUUID();
    data.id = ticketId;
    if (data.messages && data.messages.length > 0) {
      data.messages[0].ticketId = ticketId;
    }
    await ticketRepository.createTicket(data);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
