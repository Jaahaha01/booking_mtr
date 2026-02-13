import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get('x-line-signature');
        const channelSecret = process.env.LINE_CHANNEL_SECRET;
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        if (!channelSecret || !channelAccessToken) {
            console.error('Line credentials not set');
            return NextResponse.json({ error: 'Config error' }, { status: 500 });
        }

        // Verify signature
        if (signature) {
            const hash = crypto
                .createHmac('sha256', channelSecret)
                .update(body)
                .digest('base64');
            if (hash !== signature) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const events = JSON.parse(body).events;

        for (const event of events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const text = event.message.text.toLowerCase().trim();

                // Handle "id" command
                if (text === 'id' || text === 'ไอดี') {
                    const userId = event.source.userId;
                    if (userId) {
                        await replyMessage(channelAccessToken, event.replyToken, `User ID ของคุณคือ:\n${userId}\n\n(นำรหัสนี้ไปใส่ในหน้าแก้ไขโปรไฟล์เพื่อรับการแจ้งเตือน)`);
                    }
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in Line webhook:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function replyMessage(token: string, replyToken: string, text: string) {
    try {
        const response = await fetch('https://api.line.me/v2/bot/message/reply', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                replyToken: replyToken,
                messages: [{ type: 'text', text: text }],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LINE API Error:', response.status, errorText);
        }
    } catch (error) {
        console.error('Failed to send LINE reply:', error);
    }
}
