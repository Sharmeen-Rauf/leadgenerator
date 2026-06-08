import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export async function POST(req: Request) {
  try {
    const { name, company, email, score } = await req.json();

    const messageBody = `🎯 New Lead Alert — PitchRadar AI
   
Name: ${name || 'N/A'}
Company: ${company || 'N/A'}
Email: ${email || 'N/A'}
Score: ${score || 'N/A'}

Open dashboard: leadgenerator-plum.vercel.app`;

    const to = process.env.WHATSAPP_TO;
    
    if (!to) {
      return NextResponse.json({ error: "Missing WHATSAPP_TO env variable" }, { status: 500 });
    }

    const message = await client.messages.create({
      body: messageBody,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${to}`
    });

    return NextResponse.json({ success: true, messageId: message.sid });
  } catch (error: any) {
    console.error("WhatsApp Alert Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
