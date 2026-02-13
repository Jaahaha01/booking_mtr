
export async function sendPushMessage(userId: string, message: string) {
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken) {
        console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
        return;
    }

    try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${channelAccessToken}`,
            },
            body: JSON.stringify({
                to: userId,
                messages: [{ type: 'text', text: message }],
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('Error sending LINE push message:', error);
        }
    } catch (error) {
        console.error('Error sending LINE push message:', error);
    }
}
