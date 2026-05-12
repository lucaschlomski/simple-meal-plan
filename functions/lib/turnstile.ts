type TurnstileResponse = {
  success?: boolean;
};

export async function verifyTurnstile(secret: string | undefined, token: string | undefined): Promise<boolean> {
  if (!secret || !token) return false;

  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form
  });
  if (!res.ok) return false;
  const data = (await res.json().catch(() => ({}))) as TurnstileResponse;
  return data.success === true;
}
