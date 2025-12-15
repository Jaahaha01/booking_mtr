import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  // Generate a unique filename
  const ext = file.name.split('.').pop();
  const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, filename);

  // Read file buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await fs.writeFile(filePath, buffer);

  // Return public URL
  const url = `/uploads/${filename}`;
  return NextResponse.json({ url });
}
