import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { d1Run } from '@/lib/d1';
import path from 'path';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'receipts');
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

    // Validate receiptId to prevent path traversal (only alphanumeric, dash, underscore)
    if (!RECEIPT_ID_PATTERN.test(receiptId)) {
      return NextResponse.json({ error: 'Invalid receiptId' }, { status: 400 });
    }

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

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
    await d1Run(
      'UPDATE supply_receipts SET receiptFile = ? WHERE id = ?',
      [filePath, receiptId]
    );

    return NextResponse.json({ filePath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
