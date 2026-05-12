import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export const readJSON = (file: string) => {
  try {
    const filePath = path.join(DATA_DIR, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading file: ${file}`, error);
    return null;
  }
};

export const writeJSON = (file: string, data: any) => {
  try {
    const filePath = path.join(DATA_DIR, file);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing file: ${file}`, error);
    return false;
  }
};

// Appends an item to the named array inside the JSON wrapper object.
// e.g. appendToJSON('products.json', 'products', newProduct)
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

// Updates an item by id inside the named array within the JSON wrapper object.
// e.g. updateInJSON('products.json', 'products', id, updates)
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

// Deletes an item by id from the named array within the JSON wrapper object.
// e.g. deleteFromJSON('products.json', 'products', id)
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
