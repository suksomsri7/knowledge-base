export async function register() {
  const keysToTrim = [
    "DATABASE_URL",
    "AUTH_SECRET",
    "NEXTAUTH_URL",
    "BUNNY_STORAGE_ZONE",
    "BUNNY_API_KEY",
    "BUNNY_STORAGE_ENDPOINT",
    "BUNNY_CDN_URL",
  ];
  for (const key of keysToTrim) {
    if (process.env[key]) {
      process.env[key] = process.env[key]!.trim();
    }
  }
}
