import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { SignJWT, jwtVerify } from "https://deno.land/x/jose@v5.8.0/index.ts";
import bcrypt from "npm:bcryptjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60_000;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const jwtSecret = new TextEncoder().encode(Deno.env.get("AUTH_JWT_SECRET") ?? "default-secret-change-me");
const resendKey = Deno.env.get("RESEND_API_KEY");
const resendFrom = Deno.env.get("RESEND_FROM_EMAIL") ?? "no-reply@example.com";
const domain = Deno.env.get("PUBLIC_DOMAIN") ?? "https://example.com";

const jwtTtlMs = Number(Deno.env.get("AUTH_JWT_TTL_MS") ?? 1000 * 60 * 60 * 24);
const verificationTtlMs = Number(Deno.env.get("EMAIL_VERIFY_TTL_MS") ?? 1000 * 60 * 60 * 24);
const resetTtlMs = Number(Deno.env.get("PASSWORD_RESET_TTL_MS") ?? 1000 * 60 * 60);

const errorResponse = (message: string, status = 400) =>
  new Response(JSON.stringify({ message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const okResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const generateToken = (length = 48) => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  if (!resendKey) {
    console.warn("RESEND_API_KEY is not set; skipping email send.");
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to send email", { status: response.status, body: errorText });
  }
};

const sendVerificationEmail = async (email: string, token: string) => {
  const verificationLink = `${domain}/verify-email?token=${token}`;
  const subject = "Confirm your email";
  const text = `Click the link below to verify your email:\n${verificationLink}\nIf you did not create an account, ignore this message.`;
  const html = `<p>Click the link below to verify your email:</p><p><a href="${verificationLink}">${verificationLink}</a></p><p>If you did not create an account, ignore this message.</p>`;
  await sendEmail(email, subject, html, text);
};

const sendResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/reset-password?token=${token}`;
  const subject = "Reset your password";
  const text = `We received a request to reset your password.\nClick here to continue:\n${resetLink}\nIf you didn’t request this, you can ignore the email.`;
  const html = `<p>We received a request to reset your password.</p><p><a href="${resetLink}">Click here to continue</a></p><p>If you didn’t request this, you can ignore the email.</p>`;
  await sendEmail(email, subject, html, text);
};

const applyRateLimit = (req: Request) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  rateLimits.set(ip, { ...entry, count: entry.count + 1 });
  return true;
};

const sanitizeUser = (user: Record<string, unknown>) => {
  const { password_hash, totp_secret, ...safe } = user;
  return safe;
};

const getJsonBody = async (req: Request) => {
  try {
    return await req.json();
  } catch (error) {
    console.error("Invalid JSON body", error);
    throw new Error("Invalid JSON body");
  }
};

const createSession = async (userId: string, email: string) => {
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + jwtTtlMs);
  await supabase.from("auth_sessions").insert({ user_id: userId, jti, expires_at: expiresAt.toISOString() });
  const token = await new SignJWT({ sub: userId, sid: jti, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .setIssuedAt()
    .sign(jwtSecret);
  return { token, expiresAt };
};

const verifySession = async (authHeader: string | null) => {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    const { payload } = await jwtVerify(token, jwtSecret);
    const sid = payload.sid as string | undefined;
    const userId = payload.sub as string | undefined;
    if (!sid || !userId) return null;

    const { data, error } = await supabase
      .from("auth_sessions")
      .select("id, revoked, expires_at")
      .eq("jti", sid)
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return null;
    if (data.revoked) return null;
    if (new Date(data.expires_at).getTime() <= Date.now()) return null;

    return { userId, sid };
  } catch (error) {
    console.warn("JWT verification failed", error);
    return null;
  }
};

const findUserByEmail = async (email: string) => {
  return supabase.from("users").select("*").eq("email", email.toLowerCase()).maybeSingle();
};

const markExistingTokensUsed = async (table: string, userId: string) => {
  await supabase
    .from(table)
    .update({ used: true })
    .eq("user_id", userId)
    .eq("used", false);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!applyRateLimit(req)) {
    return errorResponse("Too many requests", 429);
  }

  const url = new URL(req.url);
  const pathname = url.pathname.replace(/\/+$/, "");
  const route = pathname.split("/").pop() ?? "";

  try {
    if (route === "signup" && req.method === "POST") {
      const { name, email, password } = await getJsonBody(req);
      if (!name || !email || !password) return errorResponse("Missing fields", 400);

      const normalizedEmail = String(email).toLowerCase();
      const existing = await findUserByEmail(normalizedEmail);
      if (existing.data) return errorResponse("Email already registered", 409);

      const passwordHash = await bcrypt.hash(String(password), 10);
      const { data: user, error } = await supabase
        .from("users")
        .insert({ name, email: normalizedEmail, password_hash: passwordHash })
        .select("*")
        .single();

      if (error || !user) throw error ?? new Error("Unable to create user");

      const token = generateToken();
      const expiresAt = new Date(Date.now() + verificationTtlMs).toISOString();
      await supabase.from("email_verification_tokens").insert({ user_id: user.id, token, expires_at: expiresAt });
      await sendVerificationEmail(normalizedEmail, token);

      return okResponse({ message: "Account created. Please verify your email." }, 201);
    }

    if (route === "verify-email" && req.method === "GET") {
      const token = url.searchParams.get("token");
      if (!token) return errorResponse("Token is required", 400);

      const { data, error } = await supabase
        .from("email_verification_tokens")
        .select("id, user_id, expires_at, used")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) return errorResponse("Invalid or expired token", 400);
      if (data.used) return errorResponse("Token already used", 400);
      if (new Date(data.expires_at).getTime() <= Date.now()) return errorResponse("Token expired", 400);

      await supabase.from("users").update({ email_verified: true }).eq("id", data.user_id);
      await supabase.from("email_verification_tokens").update({ used: true }).eq("id", data.id);

      return okResponse({ message: "Email verified successfully" });
    }

    if (route === "resend-verification" && req.method === "POST") {
      const { email } = await getJsonBody(req);
      if (!email) return errorResponse("Email is required", 400);
      const normalizedEmail = String(email).toLowerCase();
      const { data: user } = await findUserByEmail(normalizedEmail);

      if (!user) return okResponse({ message: "If an account exists, a verification email has been sent." });
      if (user.email_verified) return okResponse({ message: "Email already verified." });

      await markExistingTokensUsed("email_verification_tokens", user.id);
      const token = generateToken();
      const expiresAt = new Date(Date.now() + verificationTtlMs).toISOString();
      await supabase.from("email_verification_tokens").insert({ user_id: user.id, token, expires_at: expiresAt });
      await sendVerificationEmail(normalizedEmail, token);

      return okResponse({ message: "Verification email sent" });
    }

    if (route === "login" && req.method === "POST") {
      const { email, password } = await getJsonBody(req);
      if (!email || !password) return errorResponse("Missing credentials", 400);

      const { data: user } = await findUserByEmail(String(email).toLowerCase());
      const invalidMessage = "Invalid email or password";
      if (!user) return errorResponse(invalidMessage, 401);

      const match = await bcrypt.compare(String(password), user.password_hash);
      if (!match) return errorResponse(invalidMessage, 401);

      if (!user.email_verified) {
        return errorResponse("Please verify your email before logging in. Resend verification?", 403);
      }

      const { token, expiresAt } = await createSession(user.id, user.email);
      return okResponse({ user: sanitizeUser(user), token, expires_at: expiresAt.toISOString() });
    }

    if (route === "forgot-password" && req.method === "POST") {
      const { email } = await getJsonBody(req);
      if (!email) return errorResponse("Email is required", 400);
      const normalizedEmail = String(email).toLowerCase();
      const { data: user } = await findUserByEmail(normalizedEmail);

      if (!user) return okResponse({ message: "If the account exists, you will receive an email shortly." });

      await markExistingTokensUsed("password_reset_tokens", user.id);
      const token = generateToken();
      const expiresAt = new Date(Date.now() + resetTtlMs).toISOString();
      await supabase.from("password_reset_tokens").insert({ user_id: user.id, token, expires_at: expiresAt });
      await sendResetEmail(normalizedEmail, token);

      return okResponse({ message: "If the account exists, you will receive an email shortly." });
    }

    if (route === "reset-password" && req.method === "POST") {
      const { token, password } = await getJsonBody(req);
      if (!token || !password) return errorResponse("Token and password are required", 400);

      const { data, error } = await supabase
        .from("password_reset_tokens")
        .select("id, user_id, expires_at, used")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) return errorResponse("Invalid or expired token", 400);
      if (data.used) return errorResponse("Token already used", 400);
      if (new Date(data.expires_at).getTime() <= Date.now()) return errorResponse("Token expired", 400);

      const passwordHash = await bcrypt.hash(String(password), 10);
      await supabase.from("users").update({ password_hash: passwordHash }).eq("id", data.user_id);
      await supabase.from("password_reset_tokens").update({ used: true }).eq("id", data.id);
      await supabase
        .from("auth_sessions")
        .update({ revoked: true })
        .eq("user_id", data.user_id);

      return okResponse({ message: "Password updated successfully" });
    }

    if (route === "me" && req.method === "GET") {
      const session = await verifySession(req.headers.get("Authorization"));
      if (!session) return errorResponse("Unauthorized", 401);

      const { data, error } = await supabase.from("users").select("*").eq("id", session.userId).maybeSingle();
      if (error || !data) return errorResponse("User not found", 404);

      return okResponse({ user: sanitizeUser(data) });
    }

    if (route === "logout" && req.method === "POST") {
      const session = await verifySession(req.headers.get("Authorization"));
      if (!session) return errorResponse("Unauthorized", 401);

      await supabase.from("auth_sessions").update({ revoked: true }).eq("jti", session.sid);
      return okResponse({ message: "Logged out" });
    }

    return errorResponse("Not found", 404);
  } catch (error) {
    console.error("Unhandled error", error);
    return errorResponse("Internal server error", 500);
  }
});
