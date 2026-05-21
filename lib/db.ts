import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = path.join(process.cwd(), 'data');
// Vercel's filesystem is read-only; use os.tmpdir() for writes.
// Reads check tmp first so mutations persist within a warm Lambda instance.
const TMP_DIR = path.join(os.tmpdir(), 'stock-erp-data');

function ensureTmpDir() {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
}

export const readJSON = (file: string) => {
  try {
    ensureTmpDir();
    const tmpPath = path.join(TMP_DIR, file);
    if (fs.existsSync(tmpPath)) {
      return JSON.parse(fs.readFileSync(tmpPath, 'utf-8'));
    }
    const filePath = path.join(DATA_DIR, file);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`Error reading file: ${file}`, error);
    return null;
  }
};

export const writeJSON = (file: string, data: any) => {
  try {
    ensureTmpDir();
    // Always write to tmp (works on Vercel and locally)
    fs.writeFileSync(path.join(TMP_DIR, file), JSON.stringify(data, null, 2));
    // Also persist to data dir in local development
    try {
      fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
    } catch (_) {
      // Read-only in production — expected, ignore
    }
    return true;
  } catch (error) {
    console.error(`Error writing file: ${file}`, error);
    return false;
  }
};

export const appendToJSON = (file: string, key: string, item: any) => {
  try {
    const data = readJSON(file);
    if (!data || !Array.isArray(data[key])) {
      return false;
    }
    data[key].push(item);
    return writeJSON(file, data);
  } catch (error) {
    console.error(`Error appending to file: ${file}`, error);
    return false;
  }
};

export const updateInJSON = (file: string, key: string, id: string, updates: any) => {
  try {
    const data = readJSON(file);
    if (!data || !Array.isArray(data[key])) {
      return false;
    }
    const index = data[key].findIndex((item: any) => item.id === id);
    if (index === -1) {
      return false;
    }
    data[key][index] = { ...data[key][index], ...updates, updatedAt: new Date().toISOString() };
    return writeJSON(file, data);
  } catch (error) {
    console.error(`Error updating file: ${file}`, error);
    return false;
  }
};

export const deleteFromJSON = (file: string, key: string, id: string) => {
  try {
    const data = readJSON(file);
    if (!data || !Array.isArray(data[key])) {
      return false;
    }
    data[key] = data[key].filter((item: any) => item.id !== id);
    return writeJSON(file, data);
  } catch (error) {
    console.error(`Error deleting from file: ${file}`, error);
    return false;
  }
};

export const generateId = (prefix: string): string => {
  return `${prefix}${Date.now()}`;
};
