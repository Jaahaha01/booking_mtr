import { db } from '@/lib/db';

export async function sendLineNotification(userId: number, message: string) {
    try {
        // 1. Get user's Line ID from database
        const result = await db`SELECT line_user_id FROM users WHERE user_id = ${userId}`;
        const lineUserId = result[0]?.line_user_id;

        if (!lineUserId) {
            console.log(`User ${userId} does not have a Line ID configured.`);
            return;
        }

        // 2. Send message via Line Messaging API (Push Message)
        // Note: This requires a Channel Access Token from Line Developers Console
        // You should put LINE_CHANNEL_ACCESS_TOKEN in your .env.local
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        if (!token) {
            console.error('LINE_CHANNEL_ACCESS_TOKEN is not configured.');
            return;
        }

        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [
                    {
                        type: 'text',
                        text: message
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to send Line notification:', errorText);
        } else {
            console.log(`Line notification sent to user ${userId} (${lineUserId})`);
        }

    } catch (error) {
        console.error('Error sending Line notification:', error);
    }
}
