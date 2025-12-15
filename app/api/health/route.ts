import { NextResponse } from "next/server";
import { testConnection } from "../../../lib/db";

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    if (isConnected) {
      return NextResponse.json({
        status: 'healthy',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'Database connection failed',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
