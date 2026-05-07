export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {})
    }
  });
  const data = (await res.json()) as T & { ok?: boolean; error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error || "REQUEST_FAILED");
  return data;
}
