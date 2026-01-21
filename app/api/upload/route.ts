import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary using a Promise wrapper
    const result = await new Promise<any>((resolve, reject) => {
      // Use upload_stream to upload buffer directly
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'booking_app_uploads', // Optional: organize in folder
          resource_type: 'auto', // Detect image/video
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Write buffer to stream
      uploadStream.end(buffer);
    });

    console.log('Upload success:', result.secure_url);

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed: Cloudinary configuration might be missing or invalid' }, { status: 500 });
  }
}
