/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",        // สำหรับ App Router (Next.js 13+)
    "./pages/**/*.{js,ts,jsx,tsx}",      // สำหรับ Pages Router
    "./components/**/*.{js,ts,jsx,tsx}", // สำหรับ components ทั่วไป
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",     // เพิ่มสีหลัก (เช่นสำหรับปุ่ม)
        accent: "#16a34a",      // สีรอง
      },
      fontFamily: {
        sans: ["Kanit", "sans-serif"], // ใช้ฟอนต์ Kanit (ถ้าคุณใช้)
      },
    },
  },
  plugins: [],
}
