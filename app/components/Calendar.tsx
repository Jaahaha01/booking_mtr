'use client'
import { useEffect, useRef, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import thLocale from '@fullcalendar/core/locales/th';

export default function CalendarComponent() {
  const calendarRef = useRef<any>(null);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // เก็บ event ทั้งหมด
  const [isMobile, setIsMobile] = useState(false);

  // ตรวจจับขนาดหน้าจอ
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Custom render event content for all views
  function renderEventContent(eventInfo: any) {
    const props = eventInfo.event.extendedProps;
    function truncate(str: string, n: number) {
      return str && str.length > n ? str.slice(0, n) + '...' : str;
    }
    let booker = '-';
    if (props.user && (props.user.firstname || props.user.lastname)) {
      booker = `${props.user.firstname || ''} ${props.user.lastname || ''}`.trim();
    }
    let statusDetail = '';
    if (props.status === 'confirmed') {
      if (props.confirmed_name && props.confirmed_by) {
        statusDetail = `ยืนยันโดย ${props.confirmed_name}`;
      } else if (!props.confirmed_by) {
        statusDetail = 'ยืนยันโดยระบบ';
      } else {
        statusDetail = `ยืนยันโดย admin/staff`;
      }
    } else if (props.status === 'cancelled') {
      statusDetail = props.cancelled_name ? `ยกเลิกโดย ${props.cancelled_name}` : 'ยกเลิกโดย admin/staff';
    } else if (props.status === 'pending') {
      statusDetail = 'รอดำเนินการ';
    } else {
      statusDetail = props.status || '-';
    }
    const startTime = eventInfo.event.start ? eventInfo.event.start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
    const endTime = eventInfo.event.end ? eventInfo.event.end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
    // ตรวจสอบ view type
    const viewType = eventInfo.view?.type || '';
    // ตัดคำเฉพาะ week/month
    const shouldTruncate = viewType === 'dayGridWeek' || viewType === 'dayGridMonth';
    // มือถือ: ตัดให้สั้นกว่า
    const maxLen = isMobile ? 10 : 20;
    const maxBooker = isMobile ? 8 : 16;

    // โหมดเดือน: แสดงเฉพาะ ห้อง, เวลา, สถานะ
    if (viewType === 'dayGridMonth') {
      return (
        <div className="flex flex-col text-xs leading-tight">
          <span className="font-bold text-blue-900">{truncate(props.room_name || '-', maxLen)}</span>
          <span className="text-blue-700">{startTime} - {endTime}</span>
          {props.status === 'confirmed' && (
            <span className="text-green-700">
              {props.confirmed_name && props.confirmed_by
                ? `ยืนยันโดย ${truncate(props.confirmed_name, maxLen)}`
                : !props.confirmed_by
                  ? 'ยืนยันโดยระบบ'
                  : `ยืนยันโดย admin/staff`}
            </span>
          )}
          {props.status === 'pending' && (
            <span className="text-yellow-700 font-medium">
              รอดำเนินการ
            </span>
          )}
          {props.status === 'cancelled' && (
            <span className="text-red-700">
              {props.cancelled_name ? `ยกเลิกโดย ${truncate(props.cancelled_name, maxLen)}` : 'ยกเลิกโดย admin/staff'}
            </span>
          )}
        </div>
      );
    }
    // โหมดอื่น: แสดงข้อมูลเดิม
    return (
      <div className="flex flex-col text-xs leading-tight">
        <span className="font-bold text-blue-900">{shouldTruncate ? truncate(eventInfo.event.title || '-', maxLen) : (eventInfo.event.title || '-')}</span>
        <span className="text-blue-700">ห้อง: {shouldTruncate ? truncate(props.room_name || '-', maxLen) : (props.room_name || '-')}</span>
        <span className="text-blue-700">ผู้จอง: {shouldTruncate ? truncate(booker || '-', maxBooker) : (booker || '-')}</span>
        <span className="text-blue-700">{shouldTruncate ? truncate(statusDetail, maxLen) : statusDetail}</span>
        <span className="text-blue-700">{startTime} - {endTime}</span>
      </div>
    );
  }
  const [filter, setFilter] = useState('all'); // filter สถานะ
  // Map status to color
  function getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#ffe260ff'; // yellow
      case 'confirmed': return '#90e9b1ff'; // green
      case 'cancelled': return '#e78585ff'; // red
      default: return '#2563eb'; // blue
    }
  }

  // ดึง event จริงจาก API
  const fetchEvents = useCallback(() => {
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        // แปลงข้อมูลจาก API โดยใช้ข้อมูลตรงตามฐานข้อมูล
        const mapped = data.map((ev: any) => {
          const statusColor = getStatusColor(ev.status);
          return {
            ...ev,
            backgroundColor: statusColor,
            borderColor: statusColor,
            allDay: false, // กำหนดให้เป็น event แบบมีเวลาเฉพาะ
          };
        });
        try {
          console.debug('bookings fetched sample', mapped.slice(0, 3).map((e: any) => ({ id: e.id, start: e.start, end: e.end, title: e.title })));
        } catch (e) { }
        // filter เฉพาะ pending กับ confirmed
        const filtered = mapped.filter((ev: any) => ev.status === 'pending' || ev.status === 'confirmed');
        setAllEvents(filtered);
        setEvents(filtered);
      });
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter event ตามสถานะ
  useEffect(() => {
    if (filter === 'all') {
      setEvents(allEvents);
    } else {
      setEvents(allEvents.filter((ev: any) => ev.status === filter));
    }
  }, [filter, allEvents]);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ visible: boolean, x: number, y: number, content: string }>({ visible: false, x: 0, y: 0, content: '' });

  // Tooltip handler
  function handleEventMouseEnter(info: any) {
    const { jsEvent, event } = info;
    const props = event.extendedProps;
    let booker = '-';
    if (props.user && (props.user.firstname || props.user.lastname)) {
      booker = `${props.user.firstname || ''} ${props.user.lastname || ''}`.trim();
    }
    let statusDetail = '';
    if (props.status === 'confirmed') {
      if (props.confirmed_name) {
        statusDetail = `ยืนยันโดย ${props.confirmed_name} (ID: ${props.confirmed_by})`;
      } else if (props.confirmed_by) {
        statusDetail = `ยืนยันโดย admin/staff (ID: ${props.confirmed_by})`;
      } else {
        statusDetail = 'ยืนยันโดย admin/staff';
      }
    } else if (props.status === 'cancelled') {
      statusDetail = props.cancelled_name ? `ยกเลิกโดย ${props.cancelled_name}` : 'ยกเลิกโดย admin/staff';
    } else if (props.status === 'pending') {
      statusDetail = 'รอเจ้าหน้าที่ตรวจสอบ/อนุมัติ';
    } else {
      statusDetail = props.status || '-';
    }
    const startTime = event.start ? event.start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';
    const endTime = event.end ? event.end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '';

    // บน mobile ไม่แสดง tooltip แบบ hover แต่จะแสดงเป็น modal แทน
    const viewportWidth = window.innerWidth;
    const tooltipX = viewportWidth < 768 ? viewportWidth / 2 - 140 : jsEvent.clientX + 10;
    const tooltipY = viewportWidth < 768 ? 100 : jsEvent.clientY + 10;

    setTooltip({
      visible: true,
      x: tooltipX,
      y: tooltipY,
      content:
        `ห้อง: ${props.room_name || '-'}\n` +
        `หัวข้อ: ${event.title || '-'}\n` +
        `ผู้จอง: ${booker || '-'}\n` +
        `${statusDetail}\n` +
        `เวลา: ${startTime} - ${endTime}`
    });
  }
  function handleEventMouseLeave() {
    setTooltip({ ...tooltip, visible: false });
  }
  function handleEventClick(info: any) {
    handleEventMouseEnter(info);
  }

  // คำนวณ "วันนี้" ตามเวลาไทย (UTC+7)
  const getNowInThailand = () => {
    const now = new Date();
    // สร้าง date string ในเวลาไทย
    const thaiDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // YYYY-MM-DD
    return thaiDateStr;
  };

  // เมื่อ calendar mount ให้ไปที่วันนี้ (Thailand timezone)
  useEffect(() => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      const todayThai = getNowInThailand();
      api.gotoDate(todayThai);
    }
  }, []);

  return (
    <div className="bg-gradient-to-br from-blue-100 via-white to-indigo-100 rounded-2xl shadow-2xl border border-blue-200 p-0 relative">
      {/* Stylish Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 flex-shrink-0 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-700 mb-0 truncate">ตารางการจองห้องประชุม</h2>
            <p className="text-xs sm:text-sm text-blue-400">ดูตารางการจองห้องประชุมทั้งหมดแบบเรียลไทม์</p>
          </div>
        </div>
        {/* ปุ่ม refresh */}
        <button onClick={fetchEvents} className="ml-auto px-3 sm:px-4 py-2 bg-blue-500 text-white text-sm rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 active:scale-95 flex items-center gap-1.5 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">รีเฟรชข้อมูล</span>
          <span className="sm:hidden">รีเฟรช</span>
        </button>
      </div>

      {/* ปุ่ม filter สถานะ */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-6 pb-2 mt-2">
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg font-medium shadow text-sm transition-all duration-300 ${filter === 'all' ? 'bg-blue-600 text-white scale-105' : 'bg-gray-100 text-blue-700 hover:bg-blue-100'}`}>ทั้งหมด</button>
        <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg font-medium shadow text-sm transition-all duration-300 ${filter === 'pending' ? 'bg-yellow-400 text-yellow-900 scale-105' : 'bg-gray-100 text-yellow-700 hover:bg-yellow-100'}`}>รอดำเนินการ</button>
        <button onClick={() => setFilter('confirmed')} className={`px-3 py-1.5 rounded-lg font-medium shadow text-sm transition-all duration-300 ${filter === 'confirmed' ? 'bg-green-400 text-green-900 scale-105' : 'bg-gray-100 text-green-700 hover:bg-green-100'}`}>ยืนยันแล้ว</button>
      </div>

      <div className="px-2 sm:px-4 md:px-6 pb-4 sm:pb-6">
        <div className="calendar-wrapper" style={{ minHeight: isMobile ? 450 : 600 }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={isMobile ? 'listWeek' : 'dayGridWeek'}
            locale={thLocale}
            timeZone="local"
            now={getNowInThailand()}
            height={isMobile ? 450 : 600}
            events={events}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            displayEventEnd={true}
            nextDayThreshold="00:00:00"
            slotEventOverlap={false}
            eventOverlap={false}
            eventMinHeight={30}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }}
            headerToolbar={isMobile ? {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,listWeek',
            } : {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek,timeGridDay,listWeek',
            }}
            buttonText={{
              today: 'วันนี้',
              month: 'เดือน',
              week: 'สัปดาห์',
              day: 'วัน',
              list: 'รายการ',
            }}
            eventDisplay="block"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              meridiem: false,
            }}
            slotDuration="00:30:00"
            slotLabelInterval="00:30:00"
            slotMinTime="07:00:00"
            slotMaxTime="18:00:00"
            views={{
              timeGridDay: {
                slotMinTime: '07:00:00',
                slotMaxTime: '18:00:00',
                slotDuration: '00:30:00',
                slotLabelInterval: '00:30:00',
                snapDuration: '00:30:00',
                displayEventEnd: true,
                eventMinHeight: 30,
              },
              timeGridWeek: {
                slotMinTime: '07:00:00',
                slotMaxTime: '18:00:00',
                slotDuration: '00:30:00',
                slotLabelInterval: '00:30:00',
              },
              dayGridWeek: {
                dayMaxEvents: false,
                dayMaxEventRows: false,
              },
              dayGridMonth: {
                dayMaxEvents: isMobile ? 2 : 3,
                dayMaxEventRows: isMobile ? 2 : 3,
                moreLinkClick: 'popover',
                moreLinkText: (num: number) => `+ อีก ${num}`,
              },
              listWeek: {
                listDayFormat: { weekday: 'long', day: 'numeric', month: 'long' },
                noEventsText: 'ไม่มีการจองในสัปดาห์นี้',
              },
            }}
          />
        </div>

        {/* Tooltip for event info */}
        {tooltip.visible && (
          <>
            {/* Backdrop for mobile */}
            {isMobile && (
              <div
                className="fixed inset-0 bg-black/30 z-[9998]"
                onClick={() => setTooltip({ ...tooltip, visible: false })}
              />
            )}
            <div
              className="tooltip-event"
              style={{
                position: 'fixed',
                left: isMobile ? '50%' : tooltip.x,
                top: isMobile ? '50%' : tooltip.y,
                transform: isMobile ? 'translate(-50%, -50%)' : 'none',
                zIndex: 9999,
                background: 'rgba(255,255,255,0.98)',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                padding: '16px',
                minWidth: isMobile ? '280px' : '220px',
                maxWidth: isMobile ? '90vw' : '350px',
                color: '#1e293b',
                fontSize: '0.95rem',
                whiteSpace: 'pre-line',
                animation: 'fadeIn 0.3s',
              }}
            >
              {isMobile && (
                <button
                  onClick={() => setTooltip({ ...tooltip, visible: false })}
                  className="absolute top-2 right-3 text-gray-400 hover:text-gray-600 text-lg font-bold"
                >
                  ✕
                </button>
              )}
              {tooltip.content}
            </div>
          </>
        )}

        {/* Legend for booking status */}
        <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center mt-6 sm:mt-8 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full" style={{ background: '#facc15', border: '2px solid #fbbf24' }}></span>
            <span className="text-xs sm:text-sm text-gray-700">รอดำเนินการ (pending)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 sm:w-5 sm:h-5 rounded-full" style={{ background: '#22c55e', border: '2px solid #16a34a' }}></span>
            <span className="text-xs sm:text-sm text-gray-700">ยืนยันแล้ว (confirmed)</span>
          </div>
        </div>

        <style jsx global>{`
          /* =========== RESPONSIVE CALENDAR =========== */
          /* ให้ scroller ใน timeGrid สามารถ scroll แนวตั้งได้ */
          .fc .fc-timegrid .fc-scroller {
            overflow-y: auto !important;
            max-height: 600px !important;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fadeIn 0.5s; }

          .fc * {
            color: #36010df8 !important;
          }
          .fc .fc-toolbar-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #0f172a !important;
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          /* =========== TOOLBAR BUTTONS =========== */
          .fc .fc-button {
            background: #0ea5e9 !important;
            border: none;
            color: #fff !important;
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px 0 rgba(56, 189, 248, 0.3);
            transition: all 0.2s;
            font-weight: 500;
            margin: 0 0.1rem;
            padding: 0.2em 0.5em;
            font-size: 0.8rem;
            min-height: 30px;
          }
          .fc .fc-today-button {
            background: #0284c7 !important;
            color: #fff !important;
            font-size: 0.8rem;
            min-width: 50px;
          }
          .fc .fc-button:hover, .fc .fc-button:focus {
            background: #0284c7 !important;
            color: #fff !important;
            outline: none;
            transform: scale(1.05);
            box-shadow: 0 4px 12px 0 rgba(56, 189, 248, 0.4);
          }
          .fc .fc-button-primary:not(:disabled).fc-button-active, 
          .fc .fc-button-primary:not(:disabled):active {
            background: #075985 !important;
            color: #fff !important;
            box-shadow: 0 4px 12px 0 rgba(56, 189, 248, 0.5);
          }

          /* =========== TODAY HIGHLIGHT =========== */
          .fc .fc-day-today {
            background-color: #eff6ff !important;
            border: 2px solid #60a5fa !important;
            animation: fadeIn 0.5s;
          }

          /* =========== EVENTS =========== */
          .fc-daygrid-event {
            color: #1e3a5f !important;
            font-size: 0.8rem !important;
            padding: 2px 4px !important;
            overflow: hidden !important;
          }
          .fc .fc-event {
            color: #1e3a5f !important;
            border: none !important;
            border-radius: 0.5rem !important;
            font-weight: 500;
            box-shadow: 0 2px 8px 0 rgba(14, 165, 233, 0.15);
            padding: 2px 4px;
            opacity: 0.95;
            font-size: 0.8rem !important;
            transition: all 0.3s;
            animation: fadeIn 0.5s;
            overflow: hidden !important;
          }
          .fc .fc-event:hover {
            box-shadow: 0 4px 16px 0 rgba(14, 165, 233, 0.25);
            opacity: 1;
          }
          /* ป้องกันข้อความล้นออกนอก event */
          .fc .fc-event-main {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            word-break: break-word !important;
          }
          .fc .fc-event-main-frame {
            overflow: hidden !important;
          }
          .fc .fc-event-title-container {
            overflow: hidden !important;
          }
          .fc .fc-event-title {
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: normal !important;
            word-break: break-word !important;
          }
          .fc .fc-list-event {
            border-radius: 0.5rem !important;
            background: #fff !important;
            color: #1e3a5f !important;
            border: none !important;
            margin-bottom: 0.5rem;
            animation: fadeIn 0.5s;
            font-size: 0.85rem !important;
          }

          /* =========== TIMEGRID =========== */
          .fc .fc-timegrid-slot {
            min-height: 24px !important;
            height: 24px !important;
          }
          .fc .fc-timegrid .fc-timegrid-event {
            box-sizing: border-box !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            overflow: hidden !important;
          }
          .fc .fc-timegrid-event .fc-event-main {
            overflow: hidden !important;
            word-break: break-word !important;
          }
          .fc .fc-scroller {
            overflow-y: auto !important;
            max-height: 600px !important;
          }

          /* =========== MORE LINK =========== */
          .fc .fc-daygrid-more-link {
            background: #0ea5e9 !important;
            color: #fff !important;
            border: none !important;
            border-radius: 0.375rem !important;
            padding: 2px 6px !important;
            font-size: 0.7rem !important;
            font-weight: 500 !important;
            box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2) !important;
            transition: all 0.2s !important;
            text-decoration: none !important;
            margin-top: 2px !important;
          }
          .fc .fc-daygrid-more-link:hover {
            background: #0284c7 !important;
            transform: scale(1.02) !important;
            box-shadow: 0 4px 8px rgba(14, 165, 233, 0.3) !important;
          }

          /* =========== POPOVER =========== */
          .fc .fc-popover {
            background: rgba(255, 255, 255, 0.98) !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 0.75rem !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
            backdrop-filter: blur(8px) !important;
            max-width: 320px !important;
          }
          .fc .fc-popover-header {
            background: linear-gradient(135deg, #0ea5e9, #0284c7) !important;
            color: #fff !important;
            font-weight: 600 !important;
            border-radius: 0.75rem 0.75rem 0 0 !important;
            padding: 8px 12px !important;
            border-bottom: none !important;
          }
          .fc .fc-popover-body {
            padding: 8px !important;
            max-height: 300px !important;
            overflow-y: auto !important;
          }
          .fc .fc-popover-close {
            color: #fff !important;
            opacity: 0.8 !important;
            font-size: 16px !important;
          }
          .fc .fc-popover-close:hover {
            opacity: 1 !important;
          }

          /* =========== MOBILE RESPONSIVE =========== */
          @media (max-width: 767px) {
            /* Toolbar: จัดเรียงให้ไม่ล้น */
            .fc .fc-toolbar {
              flex-direction: column !important;
              gap: 0.5rem !important;
              padding: 0.5rem 0 !important;
            }
            .fc .fc-toolbar-chunk {
              display: flex;
              justify-content: center;
              width: 100%;
            }
            .fc .fc-toolbar-title {
              font-size: 0.95rem !important;
              text-align: center;
              width: 100%;
            }
            .fc .fc-button {
              padding: 0.2em 0.4em !important;
              font-size: 0.72rem !important;
              min-height: 28px !important;
              margin: 0 1px !important;
            }
            .fc .fc-today-button {
              font-size: 0.72rem !important;
              min-width: 42px !important;
            }

            /* DayGrid Header: ย่อชื่อวัน */
            .fc .fc-col-header-cell {
              font-size: 0.7rem !important;
              padding: 4px 2px !important;
            }

            /* Day cells */
            .fc .fc-daygrid-day {
              min-height: 60px !important;
            }
            .fc-daygrid-event {
              font-size: 0.68rem !important;
              padding: 1px 2px !important;
            }
            .fc .fc-event {
              font-size: 0.68rem !important;
              padding: 1px 3px !important;
            }

            /* List view: ดีกว่าบน mobile */
            .fc .fc-list {
              font-size: 0.85rem !important;
            }
            .fc .fc-list-event-title {
              font-size: 0.8rem !important;
            }

            /* Scroller height */
            .fc .fc-scroller {
              max-height: 450px !important;
            }
            .fc .fc-timegrid .fc-scroller {
              max-height: 450px !important;
            }
          }

          /* =========== TABLET =========== */
          @media (min-width: 768px) and (max-width: 1023px) {
            .fc .fc-toolbar-title {
              font-size: 1rem !important;
            }
            .fc .fc-button {
              padding: 0.2em 0.5em !important;
              font-size: 0.78rem !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
