-- Create backup_logs table for PostgreSQL
CREATE TABLE backup_logs (
    backup_id SERIAL PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL, -- เก็บขนาดไฟล์ เช่น '1.2 MB', '500 KB'
    file_url VARCHAR(500),          -- เผื่อเก็บ URL ถ้าอัพขึ้น Cloud
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'pending')),
    created_by INTEGER,             -- คนที่กด backup (Admin)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    -- เชื่อมกับตาราง Users (ถ้าคนนั้นถูกลบ ให้ตั้งเป็น NULL หรือลบ log ก็ได้ ในที่นี้เลือก SET NULL)
    CONSTRAINT fk_backup_logs_user FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- สร้าง Index เพื่อให้ค้นหาประวัติได้เร็วๆ
CREATE INDEX idx_backup_logs_created_at ON backup_logs(created_at);
CREATE INDEX idx_backup_logs_status ON backup_logs(status);
