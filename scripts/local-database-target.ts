const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function getLocalDatabaseTarget(connectionString: string): {
  host: string;
  databaseName: string;
} {
  const url = new URL(connectionString);
  const databaseName = decodeURIComponent(url.pathname.slice(1));

  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !LOCAL_HOSTS.has(url.hostname.toLowerCase()) ||
    databaseName !== "agoraya_local"
  ) {
    throw new Error(
      "Seed akun lokal hanya diizinkan ke PostgreSQL localhost dengan database bernama agoraya_local; database tidak diubah.",
    );
  }

  return { host: url.hostname, databaseName };
}
