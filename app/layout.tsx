import './globals.css';
import type { Metadata } from 'next';
import ConditionalNavbar from './components/ConditionalNavbar';
import ConditionalChatbot from './components/ConditionalChatbot';

export const metadata: Metadata = {
  title: 'ระบบจองห้องประชุม',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="bg-gray-100 min-h-screen flex flex-col">
        <ConditionalNavbar />
        <main className="pt-16 flex-1">
          {children}
        </main>
        <footer className="bg-gray-100 py-6 text-center text-gray-600 text-sm border-t border-gray-200 w-full">
          <div>
            &copy; {new Date().getFullYear()} RMUTSB | คณะวิทยาศาสตร์เทคโนโลยี | ระบบจองห้องประชุม
          </div>
        </footer>
        <ConditionalChatbot />
      </body>
    </html>
  );
}
