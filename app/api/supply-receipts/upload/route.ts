import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { readJSON, writeJSON } from '@/lib/db';
import path from 'path';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'receipts');
const RECEIPT_ID_PATTERN = /^SR\d+$/;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const receiptId = formData.get('receiptId') as string | null;

    if (!file || !receiptId) {
      return NextResponse.json({ error: 'Missing file or receiptId' }, { status: 400 });
    }

    // Validate receiptId format to prevent path traversal
    if (!RECEIPT_ID_PATTERN.test(receiptId)) {
      return NextResponse.json({ error: 'Invalid receiptId' }, { status: 400 });
    }

    // Validate file extension server-side (not relying on client-supplied MIME type)
    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: 'Only PDF, JPG, PNG allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const filename = `${receiptId}${ext}`;
    const uploadPath = path.join(UPLOAD_DIR, filename);

    // Verify resolved path stays within upload directory (prevent path traversal)
    const resolvedPath = path.resolve(uploadPath);
    if (!resolvedPath.startsWith(path.resolve(UPLOAD_DIR))) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    await writeFile(resolvedPath, Buffer.from(bytes));

    const filePath = `/uploads/receipts/${filename}`;

    // Update receipt record with file path
    const data = readJSON('supplyReceipts.json');
    if (data && Array.isArray(data.supplyReceipts)) {
      const index = data.supplyReceipts.findIndex((r: any) => r.id === receiptId);
      if (index !== -1) {
        data.supplyReceipts[index].receiptFile = filePath;
        writeJSON('supplyReceipts.json', data);
      }
    }

    return NextResponse.json({ filePath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
