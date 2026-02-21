'use client';
import { usePathname } from 'next/navigation';
import Chatbot from './Chatbot';

export default function ConditionalChatbot() {
    const pathname = usePathname();

    // ซ่อน chatbot ในหน้า login, register และหน้า admin ทั้งหมด
    if (
        pathname === "/login" ||
        pathname === "/register" ||
        pathname.startsWith("/admin")
    ) {
        return null;
    }

    return <Chatbot />;
}
