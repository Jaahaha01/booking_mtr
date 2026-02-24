import './globals.css';
import type { Metadata } from 'next';
import ConditionalNavbar from './components/ConditionalNavbar';
import ConditionalChatbot from './components/ConditionalChatbot';
import ConditionalLayout from './components/ConditionalLayout';

export const metadata: Metadata = {
  title: 'ระบบจองห้องประชุม',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="min-h-screen flex flex-col">
        <ConditionalNavbar />
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
        <ConditionalChatbot />
      </body>
    </html>
  );
}
