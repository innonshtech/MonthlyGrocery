import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = (process.env.BACKEND_INTERNAL_URL || 'http://13.233.159.143/api').replace(/\/+$/, '');

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const incomingFormData = await req.formData();
    const file = incomingFormData.get('image') || incomingFormData.get('file');
    const folder = incomingFormData.get('folder') || 'categories';

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: 'No image file uploaded' }, { status: 400 });
    }

    // Build outbound FormData for EC2 backend
    const outboundFormData = new FormData();
    outboundFormData.append('image', file, (file as any).name || 'upload.png');
    outboundFormData.append('folder', String(folder));

    const backendEndpoint = `${BACKEND_URL}/products/upload-image`;

    const backendRes = await fetch(backendEndpoint, {
      method: 'POST',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: outboundFormData,
    });

    const responseText = await backendRes.text();
    let data: any = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        return NextResponse.json(
          { success: false, error: `Invalid server response (${backendRes.status}): ${responseText.slice(0, 150)}` },
          { status: backendRes.status || 500 }
        );
      }
    }

    if (!backendRes.ok) {
      return NextResponse.json(
        { success: false, error: data?.error || `Upload failed with status ${backendRes.status}` },
        { status: backendRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Upload API Route Error]:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal upload proxy error' },
      { status: 500 }
    );
  }
}
