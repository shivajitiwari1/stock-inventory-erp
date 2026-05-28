import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { d1Run } from '@/lib/d1';
import path from 'path';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
// IDs are alphanumeric (timestamp + random suffix) — no slashes or dots allowed
const RECEIPT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const receiptId = formData.get('receiptId') as string | null;

    if (!file || !receiptId) {
      return NextResponse.json({ error: 'Missing file or receiptId' }, { status: 400 });
    }

    if (!RECEIPT_ID_PATTERN.test(receiptId)) {
      return NextResponse.json({ error: 'Invalid receiptId' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'Only PDF, JPG, PNG allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const filename = `receipts/${receiptId}${ext}`;
    const blob = await put(filename, file, { access: 'public', allowOverwrite: true });

    await d1Run(
      'UPDATE supply_receipts SET receiptFile = ? WHERE id = ?',
      [blob.url, receiptId]
    );

    return NextResponse.json({ filePath: blob.url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
