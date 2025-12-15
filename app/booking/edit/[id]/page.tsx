'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EquipmentSection from '@/app/components/EquipmentSection';

export default function EditBookingPage({ params }: { params: { id: string } }) {
  // Room state
  const [rooms, setRooms] = useState<any[]>([]);
  // Equipment state
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

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [originalTimes, setOriginalTimes] = useState<{start: string, end: string}>({start: '', end: ''});

  const router = useRouter();
  const { id } = params;

  // Parse notes to equipment state
  useEffect(() => {
    if (booking && typeof booking.notes === 'string') {
      if (booking.notes === 'ไม่ต้องการอุปกรณ์เสริม') {
        setWantEquipment(false);
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
      } else {
        setWantEquipment(true);
        const eq = {
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
        };
        const items: string[] = booking.notes.split(',').map((s: string) => s.trim());
        items.forEach((item: string) => {
          if (item.startsWith('ไมโครโฟน')) {
            eq.mic = true;
            const qty = item.match(/x(\d+)/);
            if (qty) eq.micQty = Number(qty[1]);
          } else if (item.startsWith('ลำโพง')) {
            eq.speaker = true;
            const qty = item.match(/x(\d+)/);
            if (qty) eq.speakerQty = Number(qty[1]);
          } else if (item.startsWith('โปรเจคเตอร์')) {
            eq.projector = true;
            const qty = item.match(/x(\d+)/);
            if (qty) eq.projectorQty = Number(qty[1]);
          } else if (item.startsWith('จอภาพ')) {
            eq.screen = true;
            const qty = item.match(/x(\d+)/);
            if (qty) eq.screenQty = Number(qty[1]);
          } else if (item.startsWith('อื่น ๆ:')) {
            eq.other = true;
            eq.otherText = item.replace('อื่น ๆ:', '').trim();
          }
        });
        setEquipment(eq);
      }
    }
  }, [booking]);

  // โหลดข้อมูลการจอง + ห้อง
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${id}`);
        if (!response.ok) throw new Error('ไม่พบข้อมูลการจอง');
        const data = await response.json();
        setBooking(data);
        setOriginalTimes({ start: data.start, end: data.end });

        const roomsResponse = await fetch('/api/rooms/availability');
        if (roomsResponse.ok) {
          const payload = await roomsResponse.json();
          setRooms(payload.data?.rooms || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setBooking({ ...booking, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBooking({ ...booking, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 1. Validate attendee count
    const room = rooms.find(r => (r.room_id || r.id) === Number(booking.room_id));
    const capacity = room ? parseInt(room.capacity) : 0;
    const attendeeCount = parseInt(booking.attendees);
    if (isNaN(attendeeCount) || attendeeCount < 1) {
      alert('กรุณากรอกจำนวนผู้เข้าร่วมประชุมเป็นตัวเลขที่ถูกต้อง');
      return;
    }
    if (capacity > 0 && attendeeCount > capacity) {
      alert(`จำนวนผู้เข้าร่วม (${attendeeCount}) เกินกำหนด (${capacity} คน)`);
      return;
    }
    // 2. Validate booking time
    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);
    const now = new Date();
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setError('กรุณาเลือกวันและเวลาเริ่มต้น/สิ้นสุดให้ถูกต้อง');
      return;
    }
    if (startDate < now) {
      setError('ไม่สามารถจองห้องประชุมย้อนหลังได้');
      return;
    }
    if (endDate <= startDate) {
      setError('ใส่เวลาสิ้นสุดไม่ถูกต้อง');
      return;
    }
    const diffHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (diffHours < 4) {
      setError('เวลาการจองต้องไม่น้อยกว่า 4 ชั่วโมง');
      return;
    }
    // 3. ตรวจสอบเวลาซ้ำกับ booking อื่น (user อื่น)
    try {
      const bookingsRes = await fetch('/api/bookings');
      const bookings = await bookingsRes.json();
      const overlap = bookings.some((b: any) => {
        if (b.booking_id === Number(id)) return false; // ข้าม booking ตัวเอง
        if (String(b.room_id) !== String(booking.room_id)) return false;
        if (b.status !== 'pending' && b.status !== 'confirmed') return false;
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        return (startDate < bEnd && endDate > bStart);
      });
      if (overlap) {
        setError('ช่วงเวลานี้มีการจองแล้ว กรุณาเลือกช่วงเวลาอื่น');
        return;
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการตรวจสอบเวลาซ้ำ');
      return;
    }
    // Equipment note
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
      ...booking,
      notes: wantEquipment ? equipmentNote : 'ไม่ต้องการอุปกรณ์เสริม'
    };
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        alert('บันทึกการแก้ไขสำเร็จ');
        router.push('/bookings');
      } else {
        const data = await response.json();
        alert(data.error || 'เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    }
  };

  if (loading) return <div className="p-8 text-center">กำลังโหลด...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!booking) return null;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/bookings" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors duration-200 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับไปหน้าการจอง
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">แก้ไขการจอง</h1>
        </div>
        {/* Error Alert */}
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
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Room Info (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ห้องประชุม</label>
              <input
                type="text"
                value={(() => {
                  const room = rooms.find(r => (r.room_id || r.id) === Number(booking.room_id));
                  if (!room) return '';
                  return `${room.name} (${room.room_number})`;
                })()}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                readOnly
                tabIndex={-1}
              />
            </div>
            <div>
              <label className="block font-medium mb-2 text-gray-700">วัตถุประสงค์การประชุม</label>
              <input
                type="text"
                name="title"
                value={booking.title || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>
            {/* Description */}

            {/* Attendees Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนผู้เข้าร่วมประชุม *
              </label>
              <input
                type="number"
                name="attendees"
                min={1}
                max={(() => {
                  const room = rooms.find(r => (r.room_id || r.id) === Number(booking.room_id));
                  return room ? room.capacity : undefined;
                })()}
                value={booking.attendees || ''}
                onChange={e => {
                  setBooking({ ...booking, attendees: e.target.value });
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="กรอกจำนวนผู้เข้าร่วมประชุม"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                ไม่เกิน {(() => {
                  const room = rooms.find(r => (r.room_id || r.id) === Number(booking.room_id));
                  return room ? room.capacity : '-';
                })()} คน
              </p>
            </div>
            {/* Equipment UI */}
            <EquipmentSection
              roomEquipment={rooms.find(r => r.id === Number(booking.room_id))?.equipment || ''}
              equipment={equipment}
              setEquipment={setEquipment}
              wantEquipment={wantEquipment}
              setWantEquipment={setWantEquipment}
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              บันทึกการแก้ไข
            </button>
          </form>
        </div>
      </div>
    </div>);}
