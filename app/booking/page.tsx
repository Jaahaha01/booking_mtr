"use client";
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, parseISO, isBefore, isAfter, isEqual } from 'date-fns';
import EquipmentSection from '@/app/components/EquipmentSection';

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Room {
  room_id: number;
  name: string;
  room_number: string;
  capacity: string;
  equipment: string;
  description: string;
  is_available: boolean;
}

interface BookingFormData {
  title: string;
  description: string;
  room_id: string;
  start: string;
  end: string;
  attendees: string;
  notes: string;
  timeSlot?: string;
  customStartTime?: string;
  customEndTime?: string;
}

export default function BookingForm() {
  // ...existing code...
  // ...existing code...
  const [showPastBookingPopup, setShowPastBookingPopup] = useState(false);
  const [pastBookingCountdown, setPastBookingCountdown] = useState(5);
  // Auto-close popup after 5 seconds
  useEffect(() => {
    if (showPastBookingPopup) {
      setPastBookingCountdown(5);
      const timer = setInterval(() => {
        setPastBookingCountdown((prev) => {
          if (prev <= 1) {
            setShowPastBookingPopup(false);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showPastBookingPopup]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get('room_id');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [showPendingPopup, setShowPendingPopup] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const [form, setForm] = useState<BookingFormData>({
    title: '',
    description: '',
    room_id: initialRoomId || '',
    start: '',
    end: '',
    attendees: '',
    notes: '',
    timeSlot: '',
    customStartTime: '',
    customEndTime: ''
  });
  // state สำหรับอุปกรณ์
  const [equipment, setEquipment] = useState({
    mic: false,
    micQty: 1,
    speaker: false,
    speakerQty: 1,
    projector: false,
    projectorQty: 1,
    screen: false,
    screenQty: 1,
    other: false,
    otherText: ""
  });
  const [wantEquipment, setWantEquipment] = useState(false);
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // เก็บ booking ของห้องที่เลือกในวันที่เลือก
  const [roomBookings, setRoomBookings] = useState<any[]>([]);

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        // ตรวจสอบการเข้าสู่ระบบ
        const response = await fetch('/api/profile', { cache: 'no-store' });
        if (!response.ok) {
          router.push('/login');
          return;
        }

        const userData = await response.json();
        setUser(userData);

        // ต้อง approved เท่านั้นถึงจะจองได้
        if (userData.verification_status !== 'approved') {
          setShowVerificationAlert(true);
          setLoading(false); // กันค้าง spinner
          return;
        }

        // ดึงข้อมูลห้อง + สถานะว่าง
        const roomsResponse = await fetch('/api/rooms/availability', { cache: 'no-store' });
        const payload = await roomsResponse.json();

        let roomsArr: Room[] = [];

        if (Array.isArray(payload)) {
          roomsArr = payload.map((r: any) => ({
            room_id: r.room_id ?? r.id,
            name: r.name,
            room_number: r.room_number ?? '',
            capacity: r.capacity ?? '',
            equipment: r.equipment ?? '',
            description: r.description ?? '',
            is_available: Boolean(r.is_available ?? true),
          }));
        } else if (payload?.success) {
          const src = Array.isArray(payload.data?.rooms) ? payload.data.rooms : [];
          roomsArr = src.map((r: any) => ({
            room_id: r.room_id ?? r.id,
            name: r.name,
            room_number: r.room_number ?? '',
            capacity: r.capacity ?? '',
            equipment: r.equipment ?? '',
            description: r.description ?? '',
            is_available: r.is_available ?? (r.availability === 'ว่าง'),
          }));
        } else {
          throw new Error(payload?.error || 'โหลดรายการห้องไม่สำเร็จ');
        }

        setRooms(roomsArr);
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        router.push('/login');
      }
    };

    checkAuthAndLoad();
  }, [router]);

  // Countdown effect → ไปหน้ายืนยันตัวตน
  useEffect(() => {
    if (showVerificationAlert && countdown > 0) {
      const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (showVerificationAlert && countdown === 0) {
      router.push('/verify');
    }
  }, [showVerificationAlert, countdown, router]);

  // ฟังก์ชัน handleAttendeesKeyDown สำหรับ textarea
  // ไม่ต้องใช้ handleAttendeesKeyDown อีกต่อไป

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Validate attendee count ไม่เกิน capacity
    const room = rooms.find(r => r.room_id === Number(form.room_id));
    const capacity = room ? parseInt(room.capacity) : 0;
    const attendeeCount = parseInt(form.attendees);
    if (isNaN(attendeeCount) || attendeeCount < 1) {
      setError('กรุณากรอกจำนวนผู้เข้าร่วมประชุมเป็นตัวเลขที่ถูกต้อง');
      setSubmitting(false);
      return;
    }
    if (capacity > 0 && attendeeCount > capacity) {
      setError(`จำนวนผู้เข้าร่วม (${attendeeCount}) เกินกำหนด (${capacity} คน)`);
      setSubmitting(false);
      return;
    }

    // 2. Validate booking time + overlap
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();
    startDate = new Date(form.start);
    endDate = new Date(form.end);
    if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('กรุณาเลือกวันและเวลาเริ่มต้น/สิ้นสุดให้ถูกต้อง');
      setSubmitting(false);
      return;
    }
    if (startDate < now) {
      setError('');
      setShowPastBookingPopup(true);
      setSubmitting(false);
      return;
    }
    if (endDate <= startDate) {
      setError('ใส่เวลาสิ้นสุดไม่ถูกต้อง');
      setSubmitting(false);
      return;
    }
    // ตรวจสอบเวลาทับซ้อนกับ booking อื่น (ทุก slot)
    for (const b of roomBookings) {
      const bStart = new Date(b.start);
      const bEnd = new Date(b.end);
      if (isTimeOverlap(startDate, endDate, bStart, bEnd)) {
        setError('เวลาที่เลือกทับกับช่วงเวลาที่ถูกจองไปแล้ว');
        setSubmitting(false);
        return;
      }
    }
    const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (diffHours < 4) {
      setError('เวลาการจองต้องไม่น้อยกว่า 4 ชั่วโมง');
      setSubmitting(false);
      return;
    }

    // ตรวจสอบว่าผู้ใช้จองห้องนี้ได้หรือไม่ (1 คนจองได้ 1 ห้อง ถ้าห้องที่จองล่าสุดยืนยันและสิ้นสุดแล้วถึงจองใหม่ได้)
    try {
      const bookingsRes = await fetch('/api/bookings');
      const bookings = await bookingsRes.json();
      // กรอง booking เฉพาะ user และห้องที่เลือก
      const userId = user?.id || user?.email || user?.username;
      const myRoomBookings = bookings.filter((b: any) => {
        // สมมติ API มี b.user_id หรือ b.user_email
        return String(b.room_id) === String(form.room_id) && (b.user_id === userId || b.user_email === userId);
      });
      // หา booking ล่าสุด
      const latestBooking = myRoomBookings.sort((a: any, b: any) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
      if (latestBooking) {
        const bookingEnd = new Date(latestBooking.end);
        // ถ้ายังไม่ยืนยัน หรือยังไม่หมดเวลา
        if (latestBooking.status !== 'confirmed' || bookingEnd > now) {
          setError('คุณได้ขอจองห้องประชุมนี้ไปแล้ว กรุณาตรวจสอบสถานะการจองของคุณ');
          setSubmitting(false);
          return;
        }
        // ถ้ายืนยันแล้วและหมดเวลาแล้ว → ให้จองใหม่ได้
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการตรวจสอบการจองซ้ำ');
      setSubmitting(false);
      return;
    }

    // สร้างข้อความอุปกรณ์หรือบันทึก "ไม่ต้องการอุปกรณ์เสริม" ใน notes
    let equipmentNote = '';
    if (wantEquipment) {
      const items: string[] = [];
      if (equipment.mic) items.push(`ไมโครโฟน x${equipment.micQty}`);
      if (equipment.speaker) items.push(`ลำโพง x${equipment.speakerQty}`);
      if (equipment.projector) items.push(`โปรเจคเตอร์ x${equipment.projectorQty}`);
      if (equipment.screen) items.push(`จอภาพ x${equipment.screenQty}`);
      if (equipment.other && equipment.otherText) items.push(`อื่น ๆ: ${equipment.otherText}`);
      equipmentNote = items.join(', ');
    }
    const payload = {
      ...form,
      start: startDate ? format(startDate, 'yyyy-MM-dd HH:mm:ss') : '',
      end: endDate ? format(endDate, 'yyyy-MM-dd HH:mm:ss') : '',
      notes: wantEquipment
        ? equipmentNote
        : 'ไม่ต้องการอุปกรณ์เสริม'
    };
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'เกิดข้อผิดพลาดในการจอง');
        setSubmitting(false);
        return;
      }
      setSuccess('ส่งคำขอจองห้องประชุมสำเร็จ! กรุณารอการอนุมัติจากเจ้าหน้าที่');
      setForm({
        title: '',
        description: '',
        room_id: '',
        start: '',
        end: '',
        attendees: '',
        notes: '',
        timeSlot: '',
        customStartTime: '',
        customEndTime: '',
      });
      setEquipment({
        mic: false,
        micQty: 1,
        speaker: false,
        speakerQty: 1,
        projector: false,
        projectorQty: 1,
        screen: false,
        screenQty: 1,
        other: false,
        otherText: ""
      });
      setWantEquipment(false);
      setShowPendingPopup(true);
      setTimeout(() => router.push('/bookings'), 3000);
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // ถ้าเป็น room_id ให้แปลงเป็นตัวเลข
    setForm((prev) => ({
      ...prev,
      [name]: name === 'room_id' ? String(Number(value)) : value
    }));
  };

  // ดึง booking ทั้งหมดเพื่อหา bookedDates และ booking ของห้องที่เลือกในวันที่เลือก
  useEffect(() => {
    // Always fetch latest bookings from the database for the selected room and date
    if (!form.room_id) {
      setBookedDates([]);
      setRoomBookings([]);
      return;
    }
    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => {
        const now = new Date();
        // เฉพาะ booking ที่ end > now และห้องที่เลือกเท่านั้น
        const activeBookings = data.filter((b: any) => {
          const end = new Date(b.end);
          return end > now && String(b.room_id) === String(form.room_id);
        });

        // ปิดวันเฉพาะวันที่ห้องนั้นถูกจองเต็มวัน (Full Day) ไม่ว่าจะเป็นสถานะ pending หรือ confirmed
        let fullDayDates: string[] = [];
        // หา booking ของห้องนี้ที่จองเต็มวัน (08:00-17:00) และสถานะ pending หรือ confirmed
        const fullDayBookings = activeBookings.filter((b: any) => {
          if (b.status !== 'pending' && b.status !== 'confirmed') return false;
          const start = b.start.slice(11, 16);
          const end = b.end.slice(11, 16);
          return start === '08:00' && end === '17:00';
        });
        fullDayDates = Array.from(new Set(fullDayBookings.map((b: any) => format(parseISO(b.start), 'yyyy-MM-dd'))));
        setBookedDates(fullDayDates);

        // roomBookings: booking ของห้องที่เลือกในวันที่เลือก
        if (selectedDate) {
          const dateStr = format(selectedDate, 'yyyy-MM-dd');
          const bookings = activeBookings.filter((b: any) => {
            return format(parseISO(b.start), 'yyyy-MM-dd') === dateStr;
          });
          setRoomBookings(bookings);
        } else {
          setRoomBookings([]);
        }
      });
  }, [form.room_id, selectedDate]);

  // ฟังก์ชันช่วยตรวจสอบว่าช่วงเวลาทับกับ booking ที่มีอยู่หรือไม่
  function isTimeOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
    return (
      (isBefore(startA, endB) && isAfter(endA, startB)) ||
      isEqual(startA, startB) || isEqual(endA, endB)
    );
  }

  // ฟังก์ชันช่วยสำหรับ logic disable time slot ตาม booking ที่มีอยู่ในห้องนั้น
  function getDisabledSlots() {
    // ถ้าไม่มี booking ในห้องนี้วันนี้เลย เปิดทุก slot
    if (!roomBookings.length) return { morning: false, afternoon: false, fullday: false };
    let disableMorning = false, disableAfternoon = false, disableFullDay = false;
    for (const b of roomBookings) {
      const start = b.start.slice(11, 16);
      const end = b.end.slice(11, 16);
      // Full day booking disables all slots
      if (start === '08:00' && end === '17:00') {
        disableMorning = true;
        disableAfternoon = true;
        disableFullDay = true;
        break;
      }
      // Morning booking disables morning and full day
      if (start === '08:00' && end === '12:00') {
        disableMorning = true;
        disableFullDay = true;
      }
      // Afternoon booking disables afternoon and full day
      if (start === '13:00' && end === '17:00') {
        disableAfternoon = true;
        disableFullDay = true;
      }
    }
    return { morning: disableMorning, afternoon: disableAfternoon, fullday: disableFullDay };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-fuchsia-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto mb-4"></div>
          <p className="text-fuchsia-800 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-rose-100 py-6 md:py-12">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2 text-fuchsia-700 hover:text-fuchsia-900 transition-all duration-300 font-medium bg-white/50 px-4 py-2 rounded-full hover:bg-white/80 shadow-sm hover:shadow"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับหน้าหลัก
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-purple-600 drop-shadow-sm text-center">
            จองห้องประชุม
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-fuchsia-100/50 p-6 md:p-8 border border-white/50">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-green-600 text-sm">{success}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Room Selection - move to top */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกห้องประชุม *
                  </label>
                  <select
                    name="room_id"
                    value={form.room_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-fuchsia-100 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 transition-all duration-300 bg-fuchsia-50/30 hover:bg-white"
                  >
                    <option value="">-- เลือกห้องประชุม --</option>
                    {rooms.map((room) => (
                      <option
                        key={room.room_id}
                        value={room.room_id}
                      >
                        {room.name} ({room.room_number}) - {room.capacity}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วัตถุประสงค์การประชุม *
                  </label>
                  <input
                    type="text"
                    name="title"
                    // required
                    value={form.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-fuchsia-100 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 transition-all duration-300 bg-fuchsia-50/30 hover:bg-white"
                    placeholder="เช่น ประชุมทีมพัฒนา, สัมมนาการตลาด"
                  // ...existing code...
                  />
                </div>

                {/* Date Picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">เลือกวัน *</label>
                  <DatePicker
                    selected={selectedDate}
                    onChange={date => {
                      setSelectedDate(date);
                      setForm(prev => ({ ...prev, timeSlot: '' }));
                    }}
                    dateFormat="yyyy-MM-dd"
                    minDate={new Date()}
                    filterDate={date => !form.room_id || !bookedDates.includes(format(date, 'yyyy-MM-dd'))}
                    className="w-full px-4 py-3 border border-fuchsia-100 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 transition-all duration-300 bg-fuchsia-50/30 hover:bg-white"
                    dayClassName={date => bookedDates.includes(format(date, 'yyyy-MM-dd')) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
                  // ...existing code...
                  />
                  {selectedDate && bookedDates.includes(format(selectedDate, 'yyyy-MM-dd')) && (
                    <div className="text-sm text-gray-500 mt-1">วันดังกล่าวถูกจองแล้ว กรุณาเลือกวันอื่น</div>
                  )}
                </div>

                {/* Time Slot Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">เลือกช่วงเวลา *</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                    <select
                      name="timeSlot"
                      value={form.timeSlot || ''}
                      onChange={e => {
                        const slot = e.target.value;
                        setForm(prev => {
                          let start = prev.start;
                          let end = prev.end;
                          if (selectedDate) {
                            const dateStr = format(selectedDate, 'yyyy-MM-dd');
                            if (slot === 'morning') {
                              start = `${dateStr}T08:00`;
                              end = `${dateStr}T12:00`;
                            } else if (slot === 'afternoon') {
                              start = `${dateStr}T13:00`;
                              end = `${dateStr}T17:00`;
                            } else if (slot === 'fullday') {
                              start = `${dateStr}T08:00`;
                              end = `${dateStr}T17:00`;
                            } else if (slot === 'custom') {
                              start = '';
                              end = '';
                            }
                          }
                          return { ...prev, timeSlot: slot, start, end };
                        });
                      }}
                      className="w-full px-4 py-3 border border-fuchsia-100 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 transition-all duration-300 bg-fuchsia-50/30 hover:bg-white"
                      disabled={!selectedDate}
                    >
                      <option value="">-- เลือกช่วงเวลา --</option>
                      {(() => {
                        const now = new Date();
                        const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
                        const slotEnds = {
                          morning: dateStr ? new Date(`${dateStr}T12:00:00`) : null,
                          afternoon: dateStr ? new Date(`${dateStr}T17:00:00`) : null,
                          fullday: dateStr ? new Date(`${dateStr}T17:00:00`) : null,
                        };
                        const disabled = getDisabledSlots();
                        return [
                          <option key="morning" value="morning" disabled={disabled.morning || !!(slotEnds.morning && slotEnds.morning < now)} className={disabled.morning || (slotEnds.morning && slotEnds.morning < now) ? 'text-gray-400 bg-gray-100' : ''}>
                            ช่วงเช้า (8:00 - 12:00)
                          </option>,
                          <option key="afternoon" value="afternoon" disabled={disabled.afternoon || !!(slotEnds.afternoon && slotEnds.afternoon < now)} className={disabled.afternoon || (slotEnds.afternoon && slotEnds.afternoon < now) ? 'text-gray-400 bg-gray-100' : ''}>
                            ช่วงบ่าย (13:00 - 17:00)
                          </option>,
                          <option key="fullday" value="fullday" disabled={disabled.fullday || !!(slotEnds.fullday && slotEnds.fullday < now)} className={disabled.fullday || (slotEnds.fullday && slotEnds.fullday < now) ? 'text-gray-400 bg-gray-100' : ''}>
                            ทั้งวัน (8:00 - 17:00)
                          </option>
                        ];
                      })()}
                    </select>
                  </div>
                  {/* ...removed custom time input... */}
                  {/* Show selected time for preset slots */}
                  {form.timeSlot && form.timeSlot !== 'custom' && form.start && form.end && (
                    <div className="mt-2 text-sm text-gray-700">
                      <span>เริ่ม: {form.start.replace('T', ' ')} | สิ้นสุด: {form.end.replace('T', ' ')}</span>
                    </div>
                  )}
                </div>

                {/* Attendees (จำนวนคน) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนผู้เข้าร่วมประชุม *
                  </label>
                  <input
                    type="number"
                    name="attendees"
                    min={1}
                    max={(() => {
                      const room = rooms.find(r => r.room_id === Number(form.room_id));
                      return room ? parseInt(room.capacity) : undefined;
                    })()}
                    // required
                    value={form.attendees}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-fuchsia-100 rounded-xl focus:ring-4 focus:ring-fuchsia-100 focus:border-fuchsia-400 transition-all duration-300 bg-fuchsia-50/30 hover:bg-white"
                    placeholder="กรอกจำนวนผู้เข้าร่วมประชุม"
                  // ...existing code...
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ไม่เกิน {(() => {
                      const room = rooms.find(r => r.room_id === Number(form.room_id));
                      return room ? room.capacity : '-';
                    })()} คน
                  </p>
                </div>

                {/* EquipmentSection: แสดงต่อจากจำนวนผู้เข้าร่วม */}
                <EquipmentSection
                  equipment={equipment}
                  setEquipment={setEquipment}
                  wantEquipment={wantEquipment}
                  setWantEquipment={setWantEquipment}
                />

                {/* Notes: แสดงเฉพาะเมื่อไม่ได้เลือกอุปกรณ์ */}


                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white px-6 py-4 rounded-xl shadow-lg shadow-fuchsia-200 hover:shadow-xl hover:shadow-fuchsia-300 hover:-translate-y-0.5 transition-all duration-300 font-bold text-lg flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      กำลังจอง...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      จองห้องประชุม
                    </>
                  )}
                </button>
                {showPastBookingPopup && (
                  <div className="mt-4 text-center">
                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg inline-block">
                      <span className="font-semibold">ไม่สามารถจองห้องประชุมย้อนหลังได้</span><br />
                      <span className="text-xs">กรุณาเลือกวันและเวลาให้ถูกต้อง</span>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Room Information */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-fuchsia-100/50 p-6 sticky top-8 border border-white/50">
              <h3 className="text-xl font-bold text-fuchsia-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                ข้อมูลห้องประชุม
              </h3>

              {rooms.length === 0 ? (
                <p className="text-gray-500 text-sm">ไม่มีข้อมูลห้องประชุม</p>
              ) : (
                <div className="space-y-4">
                  {rooms.map((room) => (
                    <div key={room.room_id} className={`border rounded-2xl p-5 transition-all duration-300 ${room.is_available
                      ? 'border-fuchsia-100 bg-gradient-to-br from-white to-fuchsia-50/50 hover:shadow-md hover:border-fuchsia-200'
                      : 'border-gray-200 bg-gray-50 opacity-75'
                      }`}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className={`font-bold text-lg ${room.is_available ? 'text-gray-800' : 'text-gray-500'}`}>
                          {room.name}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${room.is_available ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-gray-200 text-gray-500'
                          }`}>
                          {room.is_available ? 'ว่าง' : 'ไม่ว่าง'}
                        </span>
                      </div>
                      <p className={`text-sm mb-2 ${room.is_available ? 'text-gray-600' : 'text-gray-400'}`}>
                        ห้อง: {room.room_number}
                      </p>
                      <p className={`text-sm mb-2 ${room.is_available ? 'text-gray-600' : 'text-gray-400'}`}>
                        ความจุ: {room.capacity}
                      </p>
                      {room.description && (
                        <p className={`text-sm ${room.is_available ? 'text-gray-500' : 'text-gray-400'}`}>
                          {room.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 p-5 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-2xl border border-fuchsia-100">
                <h4 className="font-bold text-fuchsia-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  คำแนะนำ
                </h4>
                <ul className="text-sm text-fuchsia-900/80 space-y-2 pl-1">
                  <li className="flex gap-2">
                    <span className="text-fuchsia-400">•</span>
                    เลือกห้องประชุมที่เหมาะสมกับจำนวนผู้เข้าร่วม
                  </li>
                  <li className="flex gap-2">
                    <span className="text-fuchsia-400">•</span>
                    ตรวจสอบอุปกรณ์ที่จำเป็นก่อนจอง
                  </li>
                  <li className="flex gap-2">
                    <span className="text-fuchsia-400">•</span>
                    จองล่วงหน้าอย่างน้อย 1 ชั่วโมง
                  </li>
                  <li className="flex gap-2">
                    <span className="text-fuchsia-400">•</span>
                    ยกเลิกการจองหากไม่สามารถใช้ได้
                  </li>
                  <li className="flex gap-2">
                    <span className="text-fuchsia-400">•</span>
                    ห้องที่มีสถานะ &quot;ไม่ว่าง&quot; จะไม่สามารถจองได้
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Alert Popup */}
      {/* Past Booking Popup (in-page, auto-close) */}
      {/* ...ข้อความแจ้งเตือนจะแสดงใต้ปุ่มจองแทน popup... */}
      {showVerificationAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">คุณยังไม่ได้ยืนยันตัวตน</h3>
              <p className="text-gray-600 mb-6">
                คุณต้องยืนยันตัวตนก่อนจึงจะสามารถจองห้องประชุมได้
              </p>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">กำลังย้ายไปหน้ายืนยันตัวตนใน</p>
                <div className="text-2xl font-bold text-blue-600 mb-4">{countdown}</div>
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Booking Popup */}
      {showPendingPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">รอดำเนินการ</h3>
              <p className="text-gray-600 mb-6">
                คำขอจองห้องประชุมของคุณได้รับการส่งเรียบร้อยแล้ว
                กรุณารอการอนุมัติจากเจ้าหน้าที่
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
