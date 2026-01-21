'use client'
import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import thLocale from '@fullcalendar/core/locales/th';

export default function CalendarComponent() {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]); // เก็บ event ทั้งหมด
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
        statusDetail = `ยืนยันโดย ${props.confirmed_name} (ID: ${props.confirmed_by})`;
      } else if (!props.confirmed_by) {
        statusDetail = 'ยืนยันโดยระบบ';
      } else {
        statusDetail = `ยืนยันโดย admin/staff (ID: ${props.confirmed_by})`;
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
    // โหมดเดือน: แสดงเฉพาะ ห้อง, เวลา, สถานะ
    if (viewType === 'dayGridMonth') {
      return (
        <div className="flex flex-col text-xs leading-tight">
          <span className="font-bold text-blue-900">{props.room_name || '-'}</span>
          <span className="text-blue-700">{startTime} - {endTime}</span>
          {props.status === 'confirmed' && (
            <span className="text-green-700">
              {props.confirmed_name && props.confirmed_by
                ? `ยืนยันโดย ${props.confirmed_name}`
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
              {props.cancelled_name ? `ยกเลิกโดย ${props.cancelled_name}` : 'ยกเลิกโดย admin/staff'}
            </span>
          )}
        </div>
      );
    }
    // โหมดอื่น: แสดงข้อมูลเดิม
    return (
      <div className="flex flex-col text-xs leading-tight">
        <span className="font-bold text-blue-900">{shouldTruncate ? truncate(eventInfo.event.title || '-', 20) : (eventInfo.event.title || '-')}</span>
        <span className="text-blue-700">ห้อง: {shouldTruncate ? truncate(props.room_name || '-', 20) : (props.room_name || '-')}</span>
        <span className="text-blue-700">ผู้จอง: {shouldTruncate ? truncate(booker || '-', 16) : (booker || '-')}</span>
        <span className="text-blue-700">{shouldTruncate ? truncate(statusDetail, 20) : statusDetail}</span>
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
  const fetchEvents = () => {
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
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
    setTooltip({
      visible: true,
      x: jsEvent.clientX,
      y: jsEvent.clientY,
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

  return (
    <div className="bg-gradient-to-br from-blue-100 via-white to-indigo-100 rounded-2xl shadow-2xl border border-blue-200 p-0 md:p-8 mb-10 relative">
      {/* Stylish Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-2">
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-blue-700 mb-0">ตารางการจองห้องประชุม</h2>
          <p className="text-sm text-blue-400">ดูตารางการจองห้องประชุมทั้งหมดแบบเรียลไทม์</p>
        </div>
        {/* ปุ่ม refresh */}
        <button onClick={fetchEvents} className="ml-auto px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 active:scale-95 animate-fade-in">
          รีเฟรชข้อมูล
        </button>
      </div>
      {/* ปุ่ม filter สถานะ */}
      <div className="flex gap-2 px-6 pb-2 mt-2">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-lg font-medium shadow transition-all duration-300 ${filter === 'all' ? 'bg-blue-600 text-white scale-105' : 'bg-gray-100 text-blue-700 hover:bg-blue-100'}`}>ทั้งหมด</button>
        <button onClick={() => setFilter('pending')} className={`px-3 py-1 rounded-lg font-medium shadow transition-all duration-300 ${filter === 'pending' ? 'bg-yellow-400 text-yellow-900 scale-105' : 'bg-gray-100 text-yellow-700 hover:bg-yellow-100'}`}>รอดำเนินการ</button>
        <button onClick={() => setFilter('confirmed')} className={`px-3 py-1 rounded-lg font-medium shadow transition-all duration-300 ${filter === 'confirmed' ? 'bg-green-400 text-green-900 scale-105' : 'bg-gray-100 text-green-700 hover:bg-green-100'}`}>ยืนยันแล้ว</button>
      </div>
      <div className="px-2 md:px-6 pb-6">
        <div style={{ minHeight: 600, height: 600 }}>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridWeek"
            locale={thLocale}
            height={600} // กำหนดความสูง calendar
            events={events}
            eventMouseEnter={handleEventMouseEnter}
            eventMouseLeave={handleEventMouseLeave}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            displayEventEnd={true} // แสดงเวลาสิ้นสุดของ event
            nextDayThreshold="00:00:00" // กำหนดให้ event แสดงครบตามเวลาที่กำหนด
            slotEventOverlap={false} // ป้องกัน event ทับซ้อน slot
            eventOverlap={false} // ป้องกัน event ซ้อนทับกัน
            eventMinHeight={30} // ความสูงขั้นต่ำของ event
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false
            }} // รูปแบบการแสดงเวลา
            headerToolbar={{
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
              // ฟอร์แมตให้เป็น 01:00, 02:00, ... 23:00, 00:00
              // Intl.DateTimeFormat จะขึ้นต้นด้วย 01:00 ถ้า slotMinTime เป็น 01:00:00
              // ถ้าอยากให้ 00:00 อยู่ล่างสุด ให้ slotMaxTime เป็น 24:00:00
            }}
            slotDuration="00:30:00"
            slotLabelInterval="00:30:00"
            slotMinTime="07:00:00"
            slotMaxTime="18:00:00"
            views={{
              timeGridDay: {
                slotMinTime: '07:00:00',
                slotMaxTime: '18:00:00',
                slotDuration: '00:30:00', // ช่วงเวลา 30 นาที (7:00, 7:30, 8:00, 8:30...)
                slotLabelInterval: '00:30:00', // แสดงป้ายเวลาทุก 30 นาที
                snapDuration: '00:30:00', // จัดการ event ทีละ 30 นาที
                displayEventEnd: true, // แสดงเวลาสิ้นสุด
                eventMinHeight: 30, // ความสูงขั้นต่ำของ event
              },
              timeGridWeek: {
                slotMinTime: '07:00:00',
                slotMaxTime: '18:00:00',
                slotDuration: '00:30:00', // ช่วงเวลา 30 นาที
                slotLabelInterval: '00:30:00', // แสดงป้ายเวลาทุก 30 นาที
              },
              dayGridWeek: {
                dayMaxEvents: false, // ไม่จำกัดจำนวนรายการในโหมดสัปดาห์
                dayMaxEventRows: false, // ไม่จำกัดจำนวนแถวในโหมดสัปดาห์
              },
              dayGridMonth: {
                dayMaxEvents: 3, // จำกัดแสดงเพียง 3 รายการต่อวันในโหมดเดือนเท่านั้น
                dayMaxEventRows: 3, // จำกัดจำนวนแถวที่แสดงในโหมดเดือน
                moreLinkClick: 'popover', // เมื่อกด "Show more" ให้แสดงเป็น popover
                moreLinkText: (num: number) => `+ อีก ${num} รายการ`, // ข้อความแสดงจำนวนรายการที่เหลือ
              },
            }}
          />
        </div>
        {/* Tooltip for event info */}
        {tooltip.visible && (
          <div
            style={{ position: 'fixed', left: tooltip.x + 10, top: tooltip.y + 10, zIndex: 9999, background: 'rgba(255,255,255,0.98)', border: '1px solid #e5e7eb', borderRadius: '0.5rem', boxShadow: '0 2px 8px #0002', padding: '12px', minWidth: '220px', color: '#1e293b', fontSize: '0.95rem', whiteSpace: 'pre-line', animation: 'fadeIn 0.3s' }}
          >
            {tooltip.content}
          </div>
        )}
        {/* Legend for booking status */}
        <div className="flex flex-wrap gap-6 items-center justify-center mt-8 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 h-5 rounded-full" style={{ background: '#facc15', border: '2px solid #fbbf24' }}></span>
            <span className="text-sm text-gray-700">รอดำเนินการ (pending)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 h-5 rounded-full" style={{ background: '#22c55e', border: '2px solid #16a34a' }}></span>
            <span className="text-sm text-gray-700">ยืนยันแล้ว (confirmed)</span>
          </div>
        </div>
        <style jsx global>{`
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
            color: #0f172a !important; /* slate-900 */
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .fc .fc-button {
            background: #0ea5e9 !important; /* สีฟ้า sky-500 */
            border: none;
            color: #fff !important;
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px 0 rgba(56, 189, 248, 0.3);
            transition: all 0.2s;
            font-weight: 500;
            margin: 0 0.15rem;
            padding: 0.25em 0.7em;
            font-size: 0.85rem;
            min-height: 32px;
          }
          .fc .fc-today-button {
            background: #0284c7 !important; /* สีฟ้าเข้ม sky-600 */
            color: #fff !important;
            font-size: 0.85rem;
            min-width: 60px;
          }
          .fc .fc-button:hover, .fc .fc-button:focus {
            background: #0284c7 !important; /* sky-600 */
            color: #fff !important;
            outline: none;
            transform: scale(1.05);
            box-shadow: 0 4px 12px 0 rgba(56, 189, 248, 0.4);
          }
          .fc .fc-button-primary:not(:disabled).fc-button-active, .fc .fc-button-primary:not(:disabled):active {
            background: #075985 !important; /* sky-800 */
            color: #fff !important;
            box-shadow: 0 4px 12px 0 rgba(56, 189, 248, 0.5);
          }
          .fc .fc-day-today {
            background-color: #f0f9ff !important; /* sky-50 */
            border: 2px solid #7dd3fc !important; /* sky-300 */
            animation: fadeIn 0.5s;
          }
          .fc-daygrid-event {
            color: lab(33 8.88 -38.98) !important;
            font-size: 0.85rem !important;
            padding: 2px 6px !important;
          }
          .fc .fc-event {
            color: lab(33 8.88 -38.98) !important;
            border: none !important;
            border-radius: 0.5rem !important;
            font-weight: 500;
            box-shadow: 0 2px 8px 0 rgba(14, 165, 233, 0.15);
            padding: 2px 6px;
            opacity: 0.95;
            font-size: 0.85rem !important;
            transition: all 0.3s;
            animation: fadeIn 0.5s;
          }
          .fc .fc-event:hover {
            box-shadow: 0 4px 16px 0 rgba(14, 165, 233, 0.25);
            opacity: 1;
          }
          .fc .fc-list-event {
            border-radius: 0.5rem !important;
            background: #ffffffff !important;
            color: lab(33 8.88 -38.98) !important;
            border: none !important;
            margin-bottom: 0.5rem;
            animation: fadeIn 0.5s;
            font-size: 0.85rem !important;
          }
          .fc .fc-timegrid-slot {
            min-height: 24px !important;
            height: 24px !important;
          }
          .fc .fc-timegrid .fc-timegrid-event-harness {
           /* overflow: hidden !important; - removed to prevent clipping */
          }
          .fc .fc-timegrid .fc-timegrid-event {
            box-sizing: border-box !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
          }
          /* ensure slot lane clips children */
          .fc .fc-timegrid .fc-timegrid-slot-lane {
            /* overflow: hidden !important; - removed to prevent clipping */
          }
          /* ให้ .fc-scroller มี scrollbar แนวตั้งและความสูงจำกัด */
          .fc .fc-scroller {
            overflow-y: auto !important;
            max-height: 600px !important;
          }
          .fc .fc-timegrid-event-harness > * {
            /* max-height: 100% !important; */
            /* overflow: hidden !important; */
          }
          /* สไตล์สำหรับ "Show more" link */
          .fc .fc-daygrid-more-link {
            background: #0ea5e9 !important; /* sky-500 */
            color: #fff !important;
            border: none !important;
            border-radius: 0.375rem !important;
            padding: 2px 8px !important;
            font-size: 0.75rem !important;
            font-weight: 500 !important;
            box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2) !important;
            transition: all 0.2s !important;
            text-decoration: none !important;
            margin-top: 2px !important;
          }
          .fc .fc-daygrid-more-link:hover {
            background: #0284c7 !important; /* sky-600 */
            transform: scale(1.02) !important;
            box-shadow: 0 4px 8px rgba(14, 165, 233, 0.3) !important;
          }
          /* สไตล์สำหรับ popover ที่แสดงรายการเพิ่มเติม */
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
        `}</style>
      </div>
    </div>
  );
}
