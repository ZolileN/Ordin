export interface StorageFile {
  key: string;
  buffer: Buffer;
  mimeType: string;
  size: number;
}

async function getLocalStorage() {
  const [{ promises: fs }, path] = await Promise.all([
    import("fs"),
    import("path"),
  ]);

  function getStorageRoot(): string {
    if (process.env.STORAGE_LOCAL_PATH) {
      return path.isAbsolute(process.env.STORAGE_LOCAL_PATH)
        ? process.env.STORAGE_LOCAL_PATH
        : path.join(process.cwd(), process.env.STORAGE_LOCAL_PATH);
    }

    if (process.env.VERCEL) {
      return path.join("/tmp", "ordin-uploads");
    }

    return path.join(process.cwd(), "uploads");
  }

  function resolveStoragePath(key: string): string {
    const safeKey = key.replace(/\.\./g, "").replace(/^[/\\]+/, "");
    return path.join(getStorageRoot(), safeKey);
  }

  return { fs, resolveStoragePath, path };
}

export async function uploadFile(
  organizationId: string,
  fileName: string,
  buffer: Buffer,
  _mimeType: string
): Promise<string> {
  const storageType = process.env.STORAGE_TYPE ?? "local";

  if (storageType === "local") {
    const { fs, resolveStoragePath, path } = await getLocalStorage();
    const key = `${organizationId}/${Date.now()}-${fileName}`;
    const filePath = resolveStoragePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return key;
  }

  throw new Error(`Storage type ${storageType} not implemented`);
}

export async function getFile(key: string): Promise<Buffer> {
  const storageType = process.env.STORAGE_TYPE ?? "local";

  if (storageType === "local") {
    const { fs, resolveStoragePath } = await getLocalStorage();
    return fs.readFile(resolveStoragePath(key));
  }

  throw new Error(`Storage type ${storageType} not implemented`);
}

export async function deleteFile(key: string): Promise<void> {
  const storageType = process.env.STORAGE_TYPE ?? "local";

  if (storageType === "local") {
    const { fs, resolveStoragePath } = await getLocalStorage();
    try {
      await fs.unlink(resolveStoragePath(key));
    } catch {
      // file may not exist
    }
    return;
  }

  throw new Error(`Storage type ${storageType} not implemented`);
}
