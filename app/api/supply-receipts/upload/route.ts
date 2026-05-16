import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { readJSON, writeJSON } from '@/lib/db';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const receiptId = formData.get('receiptId') as string | null;

    if (!file || !receiptId) {
      return NextResponse.json({ error: 'Missing file or receiptId' }, { status: 400 });
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, JPG, PNG allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const ext = path.extname(file.name) || '.bin';
    const filename = `${receiptId}${ext}`;
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', 'receipts', filename);

    const bytes = await file.arrayBuffer();
    await writeFile(uploadPath, Buffer.from(bytes));

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
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
