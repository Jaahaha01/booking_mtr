-- Add Line User ID to users table
ALTER TABLE users ADD COLUMN line_user_id VARCHAR(100);

-- Create feedbacks table
CREATE TABLE feedbacks (
  feedback_id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL UNIQUE, -- One feedback per booking
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_feedbacks_booking FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
);

-- Add index
CREATE INDEX idx_feedbacks_booking_id ON feedbacks(booking_id);
