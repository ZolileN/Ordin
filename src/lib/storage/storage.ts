import { promises as fs } from "fs";
import path from "path";

export interface StorageFile {
  key: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}

const LOCAL_PATH = process.env.STORAGE_LOCAL_PATH ?? "./uploads";

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function uploadFile(
  organizationId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const key = `${organizationId}/${Date.now()}-${fileName}`;
  const storageType = process.env.STORAGE_TYPE ?? "local";

  if (storageType === "local") {
    const filePath = path.join(LOCAL_PATH, key);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, buffer);
    return key;
  }

  throw new Error(`Storage type ${storageType} not implemented`);
}

export async function getFile(key: string): Promise<Buffer> {
  const storageType = process.env.STORAGE_TYPE ?? "local";

  if (storageType === "local") {
    const filePath = path.join(LOCAL_PATH, key);
    return fs.readFile(filePath);
  }

  throw new Error(`Storage type ${storageType} not implemented`);
}

export async function deleteFile(key: string): Promise<void> {
  const storageType = process.env.STORAGE_TYPE ?? "local";

  if (storageType === "local") {
    const filePath = path.join(LOCAL_PATH, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // file may not exist
    }
    return;
  }

  throw new Error(`Storage type ${storageType} not implemented`);
}
