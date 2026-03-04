export async function uploadToBunny(
  file: Buffer | Uint8Array,
  fileName: string,
  path: string
): Promise<string> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE!;
  const apiKey = process.env.BUNNY_API_KEY!;
  const endpoint = process.env.BUNNY_STORAGE_ENDPOINT!;
  const cdnUrl = process.env.BUNNY_CDN_URL!;

  const uploadUrl = `${endpoint}/${storageZone}/${path}/${fileName}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: apiKey,
      "Content-Type": "application/octet-stream",
    },
    body: new Uint8Array(file),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  return `${cdnUrl}/${path}/${fileName}`;
}

export async function deleteFromBunny(path: string): Promise<void> {
  const storageZone = process.env.BUNNY_STORAGE_ZONE!;
  const apiKey = process.env.BUNNY_API_KEY!;
  const endpoint = process.env.BUNNY_STORAGE_ENDPOINT!;

  await fetch(`${endpoint}/${storageZone}/${path}`, {
    method: "DELETE",
    headers: { AccessKey: apiKey },
  });
}
