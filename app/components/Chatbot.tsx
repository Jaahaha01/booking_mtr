'use client';
import { useState, useEffect, useRef } from 'react';
// Utility: auto-resize textarea
function autoResizeTextarea(textarea: HTMLTextAreaElement | null) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  options?: string[];
}

interface Room {
  id: number;
  name: string;
  capacity: string;
  equipment: string;
  availability: 'ว่าง' | 'ไม่ว่าง';
  currentBooking?: {
    title: string;
    start: string;
    end: string;
  };
}

interface RoomStats {
  id: number;
  name: string;
  capacity: string;
  booking_count: number;
  unique_users: number;
  avg_duration_hours: number;
  total_hours: number;
}

const quickQuestions = [
  "ห้องประชุมไหนว่างบ้าง?",
  "จองห้องยังไง?",
  "เช็คสถานะการจอง",
  "อุปกรณ์ในห้องประชุม",
  "ยกเลิกการจองยังไง?",
  "ติดต่อเจ้าหน้าที่"
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '👋 สวัสดีครับ! ผมคือผู้ช่วยจองห้องประชุม เลือกคำถามที่ต้องการได้เลยครับ',
      sender: 'bot',
      timestamp: new Date(),
      options: quickQuestions
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [roomData, setRoomData] = useState<Room[]>([]);
  const [statsData, setStatsData] = useState<RoomStats[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch room availability data
  const fetchRoomAvailability = async () => {
    try {
      const response = await fetch('/api/rooms/availability');
      const data = await response.json();
      if (data.success) {
        setRoomData(data.data.rooms);
      }
    } catch (error) {
      console.error('Error fetching room availability:', error);
    }
  };

  // Fetch room statistics data
  const fetchRoomStatistics = async () => {
    try {
      const response = await fetch('/api/rooms/statistics');
      const data = await response.json();
      if (data.success) {
        setStatsData(data.data.mostBookedRooms);
      }
    } catch (error) {
      console.error('Error fetching room statistics:', error);
    }
  };

  useEffect(() => {
    fetchRoomAvailability();
    fetchRoomStatistics();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRoomAvailability();
      fetchRoomStatistics();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickQuestion = (question: string) => {
    addMessage(question, 'user');
    handleBotResponse(question);
  };

  const addMessage = (text: string, sender: 'user' | 'bot', options?: string[]) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date(),
      options
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      addMessage(inputMessage, 'user');
      handleBotResponse(inputMessage);
      setInputMessage('');
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        text: 'สวัสดีครับ! 👋 ผมเป็นผู้ช่วยที่จะช่วยในการตอบคำถามเกี่ยวกับการจองห้องประชุม\n\nคุณสามารถเลือกคำถามจากตัวเลือกด้านล่าง หรือถามอะไรก็ได้ครับ!',
        sender: 'bot',
        timestamp: new Date(),
        options: quickQuestions
      }
    ]);
  };

  // Enable typing input
  const handleBotResponse = async (userMessage: string) => {
    setIsTyping(true);
    // await new Promise(resolve => setTimeout(resolve, 400)); // Remove fake delay, wait for real API

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });

      if (res.ok) {
        const data = await res.json();
        addMessage(data.reply, 'bot', quickQuestions); // Always show quick questions as backup options
      } else {
        addMessage('ขออภัย ระบบขัดข้องชั่วคราว', 'bot');
      }
    } catch (e) {
      addMessage('ไม่สามารถติดต่อเซิร์ฟเวอร์ได้', 'bot');
    }

    setIsTyping(false);
  };

  const handleOptionClick = (option: string) => {
    if (option.includes('จองห้องประชุม')) {
      window.location.href = '/booking';
    } else if (option.includes('ดูตาราง') || option.includes('กลับไปหน้าแรก')) {
      window.location.href = '/';
    } else if (option.includes('สถานะการจอง')) {
      window.location.href = '/booking_status';
    } else if (option.includes('โปรไฟล์')) {
      window.location.href = '/profile';
    } else if (option.includes('สถิติการจอง') || option.includes('ดูสถิติ')) {
      window.location.href = '/rooms/statistics';
    } else if (option.includes('ติดต่อแอดมิน')) {
      handleQuickQuestion('ติดต่อแอดมิน');
    } else {
      handleQuickQuestion(option);
    }
  };

  return (
    <>
      {/* Messenger-style Chatbot Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-tr from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group focus:outline-none focus:ring-4 focus:ring-blue-200"
        title="AI Assistant"
        aria-label="AI Assistant"
        style={{ boxShadow: '0 8px 32px 0 rgba(0, 123, 255, 0.25)' }}
      >
        <span className="sr-only">AI Assistant</span>
        <svg className={`w-7 h-7 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          )}
        </svg>
        {!isOpen && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>}
      </button>

      {/* Messenger-style Chatbot Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-40 w-full max-w-md h-[70vh] md:w-96 md:h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header - Messenger Style */}
          <div className="bg-gradient-to-tr from-blue-500 to-blue-400 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Chat Bot</h3>
                <p className="text-xs text-blue-100 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  ออนไลน์
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearChat}
                className="text-xs bg-white/20 hover:bg-white/40 text-white px-2 py-1 rounded transition-colors"
                title="ล้างแชท"
              >
                ล้างแชท
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition-colors"
                title="ปิด"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area - Messenger Style */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-3 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-blue-50">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.sender === 'bot' && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${message.sender === 'user'
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-white text-gray-800 rounded-bl-md shadow-sm border border-gray-200'
                  }`}>
                  {message.sender === 'bot' ? (
                    <p className="text-sm whitespace-pre-line leading-relaxed" dangerouslySetInnerHTML={{ __html: message.text }} />
                  ) : (
                    <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  )}
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                    {message.timestamp.toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center ml-2 flex-shrink-0">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator - Messenger Style */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="bg-white text-gray-800 px-4 py-2 rounded-2xl rounded-bl-md shadow-sm border border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Options - Messenger Style */}
            {messages[messages.length - 1]?.options && !isTyping && (
              <div className="space-y-2">
                <div className="flex justify-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md shadow-sm border border-gray-200 p-3 max-w-xs">
                    <p className="text-xs text-gray-500 mb-2">เลือกคำถามที่ต้องการ:</p>
                    <div className="space-y-2">
                      {messages[messages.length - 1].options?.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleOptionClick(option)}
                          className="w-full text-left p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-sm text-blue-700 transition-colors duration-200 hover:shadow-sm"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
            {/* Scroll to bottom button */}
            <button
              onClick={scrollToBottom}
              className="fixed bottom-36 right-8 z-50 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-full text-xs shadow transition-all duration-200 md:right-10"
              style={{ display: 'block' }}
              title="เลื่อนไปข้อความล่าสุด"
            >
              เลื่อนไปล่าสุด
            </button>
          </div>

          {/* Input Area - Messenger Style */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-end space-x-2 bg-gray-100 rounded-3xl p-2">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="สอบถามได้เลยครับ..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none max-h-32 py-2 px-2"
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  autoResizeTextarea(e.target);
                }}
                onKeyDown={handleKeyPress}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={`p-2 rounded-full flex-shrink-0 transition-colors duration-200 ${inputMessage.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md'
                  : 'bg-gray-300 text-gray-400 cursor-not-allowed'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
