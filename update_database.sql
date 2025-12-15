-- อัปเดตฐานข้อมูลที่มีอยู่แล้ว
USE booking_db;

-- เพิ่มคอลัมน์ verification_status
ALTER TABLE users ADD COLUMN verification_status ENUM('pending', 'approved', 'rejected') DEFAULT NULL AFTER is_verified;

-- อัปเดตข้อมูลที่มีอยู่แล้ว
UPDATE users SET verification_status = 'approved' WHERE is_verified = TRUE;
UPDATE users SET verification_status = NULL WHERE is_verified = FALSE;

-- แสดงผลลัพธ์
SELECT id, username, email, is_verified, verification_status FROM users;

-- เพิ่มคอลัมน์ confirmed_by และ cancelled_by ในตาราง bookings
ALTER TABLE bookings ADD COLUMN confirmed_by INT NULL AFTER status;
ALTER TABLE bookings ADD COLUMN cancelled_by INT NULL AFTER confirmed_by;
-- เพิ่ม foreign key constraint
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_confirmed_by FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE bookings ADD CONSTRAINT fk_bookings_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL;
