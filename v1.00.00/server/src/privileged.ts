import { definePrivilegedContracts, definePrivilegedHandlers, z } from "@hatch/space-sdk";

export const privileged = definePrivilegedContracts({
  getCineCloudConfig: {
    request: z.object({}),
    response: z.object({ storage_ready: z.boolean(), billing_ready: z.boolean() }),
  },
  presignCineB2: {
    request: z.object({ method: z.enum(["GET", "PUT"]), storage_key: z.string().min(1), expires_seconds: z.number().int().positive().max(900) }),
    response: z.discriminatedUnion("ok", [
      z.object({ ok: z.literal(true), url: z.string() }),
      z.object({ ok: z.literal(false), error: z.string() }),
    ]),
  },
  uploadCineB2: {
    request: z.object({
      storage_key: z.string().min(1),
      mime_type: z.string().regex(/^video\/[a-zA-Z0-9.+-]+$/),
      data_base64: z.string().min(1).max(70_000_000),
    }),
    response: z.object({ ok: z.boolean(), error: z.string().nullable() }),
  },
  verifyCineB2Object: {
    request: z.object({ storage_key: z.string().min(1), expected_size: z.number().int().nonnegative() }),
    response: z.object({ ok: z.boolean(), error: z.string().nullable() }),
  },
  deleteCineB2Object: {
    request: z.object({ storage_key: z.string().min(1) }),
    response: z.object({ ok: z.boolean(), error: z.string().nullable() }),
  },
  createCineStripeCheckout: {
    request: z.object({}),
    response: z.discriminatedUnion("ok", [
      z.object({ ok: z.literal(true), url: z.string(), session_id: z.string() }),
      z.object({ ok: z.literal(false), error: z.string() }),
    ]),
  },
  verifyCineStripeCheckout: {
    request: z.object({ session_id: z.string().min(1).max(200) }),
    response: z.object({ paid: z.boolean(), quota_bytes: z.number(), error: z.string().nullable() }),
  },
  getCineSocialConfig: {
    request: z.object({}),
    response: z.object({
      tiktok: z.boolean(),
      youtube: z.boolean(),
      facebook: z.boolean(),
      x: z.boolean(),
      bluesky: z.boolean(),
      instagram: z.boolean(),
    }),
  },
  fetchWikidataActors: {
    request: z.object({ limit: z.number().int().min(1).max(1100) }),
    response: z.discriminatedUnion("ok", [
      z.object({ ok: z.literal(true), actors: z.array(z.object({ qid: z.string(), name: z.string(), source_url: z.string().url() })) }),
      z.object({ ok: z.literal(false), error: z.string() }),
    ]),
  },
});

const FREE_QUOTA_BYTES = 500_000_000;

function configValue(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function b2Config(): { endpoint: string; region: string; bucket: string; keyId: string; applicationKey: string } | null {
  const endpoint = configValue("B2_S3_ENDPOINT").replace(/\/$/, "");
  const region = configValue("B2_REGION");
  const bucket = configValue("B2_BUCKET");
  const keyId = configValue("B2_KEY_ID");
  const applicationKey = configValue("B2_APPLICATION_KEY");
  return endpoint && region && bucket && keyId && applicationKey
    ? { endpoint, region, bucket, keyId, applicationKey }
    : null;
}

function billingReady(): boolean {
  return Boolean(
    configValue("STRIPE_SECRET_KEY")
    && configValue("STRIPE_CINE_PRICE_ID")
    && configValue("CINE_STRIPE_SUCCESS_URL")
    && configValue("CINE_STRIPE_CANCEL_URL")
    && Number(configValue("CINE_PAID_QUOTA_BYTES")) > FREE_QUOTA_BYTES,
  );
}

function awsEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: Uint8Array, value: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", Uint8Array.from(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value)));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function presignedUrl(method: "GET" | "PUT" | "HEAD" | "DELETE", storageKey: string, expiresInSeconds: number): Promise<string> {
  const config = b2Config();
  if (!config) throw new Error("Backblaze B2 storage is not configured");
  const endpoint = new URL(config.endpoint);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const canonicalUri = `/${[config.bucket, ...storageKey.split("/")].map(awsEncode).join("/")}`;
  const params: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    "X-Amz-Credential": `${config.keyId}/${credentialScope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": "host",
  };
  const canonicalQuery = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${awsEncode(key)}=${awsEncode(value)}`)
    .join("&");
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuery}\nhost:${endpoint.host}\n\nhost\nUNSIGNED-PAYLOAD`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;
  const dateKey = await hmacSha256(new TextEncoder().encode(`AWS4${config.applicationKey}`), dateStamp);
  const regionKey = await hmacSha256(dateKey, config.region);
  const serviceKey = await hmacSha256(regionKey, "s3");
  const signingKey = await hmacSha256(serviceKey, "aws4_request");
  const signature = bytesToHex(await hmacSha256(signingKey, stringToSign));
  endpoint.pathname = canonicalUri;
  endpoint.search = `${canonicalQuery}&X-Amz-Signature=${signature}`;
  return endpoint.toString();
}

export const privilegedHandlers = definePrivilegedHandlers(privileged, {
  getCineCloudConfig() {
    return { storage_ready: b2Config() !== null, billing_ready: billingReady() };
  },
  getCineSocialConfig() {
    return {
      tiktok: Boolean(configValue("TIKTOK_CLIENT_KEY") && configValue("TIKTOK_CLIENT_SECRET")),
      youtube: Boolean(configValue("YOUTUBE_CLIENT_ID") && configValue("YOUTUBE_CLIENT_SECRET")),
      facebook: Boolean(configValue("FACEBOOK_APP_ID") && configValue("FACEBOOK_APP_SECRET")),
      x: Boolean(configValue("X_CLIENT_ID") && configValue("X_CLIENT_SECRET")),
      bluesky: Boolean(configValue("BLUESKY_HANDLE") && configValue("BLUESKY_APP_PASSWORD")),
      instagram: Boolean(configValue("INSTAGRAM_APP_ID") && configValue("INSTAGRAM_APP_SECRET")),
    };
  },
  async fetchWikidataActors(args) {
    const rosterQuery = `SELECT DISTINCT ?person ?personLabel WHERE {
      ?person <http://www.wikidata.org/prop/direct/P106> <http://www.wikidata.org/entity/Q33999>.
      ?person <http://www.w3.org/2000/01/rdf-schema#label> ?personLabel.
      FILTER(LANG(?personLabel) = "en")
    } LIMIT ${args.limit}`;
    const originalsQuery = `SELECT DISTINCT ?person ?personLabel WHERE {
      VALUES ?personLabel { "Robert De Niro"@en "Robert Redford"@en }
      ?person <http://www.w3.org/2000/01/rdf-schema#label> ?personLabel.
    }`;
    try {
      const request = (query: string) => fetch("https://query.wikidata.org/sparql", {
        method: "POST",
        headers: {
          Accept: "application/sparql-results+json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "PIX/1.0",
        },
        body: new URLSearchParams({ query }),
      });
      const [rosterResponse, originalsResponse] = await Promise.all([request(rosterQuery), request(originalsQuery)]);
      const [rosterPayload, originalsPayload]: unknown[] = await Promise.all([rosterResponse.json(), originalsResponse.json()]);
      const resultSchema = z.object({ results: z.object({ bindings: z.array(z.object({ person: z.object({ value: z.string().url() }), personLabel: z.object({ value: z.string() }) })) }) });
      const rosterParsed = resultSchema.safeParse(rosterPayload);
      const originalsParsed = resultSchema.safeParse(originalsPayload);
      if (!rosterResponse.ok || !originalsResponse.ok || !rosterParsed.success || !originalsParsed.success) return { ok: false, error: "Wikidata did not return the actor roster." } as const;
      const actors = [...originalsParsed.data.results.bindings, ...rosterParsed.data.results.bindings].flatMap((row) => {
        const qid = row.person.value.match(/Q\d+$/)?.[0];
        const name = row.personLabel.value.trim();
        return qid && name && name !== qid ? [{ qid, name, source_url: row.person.value }] : [];
      });
      return { ok: true, actors } as const;
    } catch {
      return { ok: false, error: "Wikidata could not be reached." } as const;
    }
  },
  async presignCineB2(args) {
    try {
      return { ok: true, url: await presignedUrl(args.method, args.storage_key, args.expires_seconds) } as const;
    } catch {
      return { ok: false, error: "Backblaze B2 storage is not configured." } as const;
    }
  },
  async uploadCineB2(args) {
    try {
      const bytes = Buffer.from(args.data_base64, "base64");
      const url = await presignedUrl("PUT", args.storage_key, 120);
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": args.mime_type },
        body: bytes,
      });
      return response.ok
        ? { ok: true, error: null }
        : { ok: false, error: "Backblaze B2 did not accept the clip." };
    } catch {
      return { ok: false, error: "Backblaze B2 could not be reached." };
    }
  },
  async verifyCineB2Object(args) {
    try {
      const url = await presignedUrl("HEAD", args.storage_key, 120);
      const response = await fetch(url, { method: "HEAD" });
      const size = Number(response.headers.get("content-length") ?? "0");
      return response.ok && size === args.expected_size
        ? { ok: true, error: null }
        : { ok: false, error: "The uploaded file could not be verified in Backblaze B2." };
    } catch {
      return { ok: false, error: "Backblaze B2 could not be reached." };
    }
  },
  async deleteCineB2Object(args) {
    try {
      const url = await presignedUrl("DELETE", args.storage_key, 120);
      const response = await fetch(url, { method: "DELETE" });
      return response.ok || response.status === 404
        ? { ok: true, error: null }
        : { ok: false, error: "Backblaze B2 did not remove the clip." };
    } catch {
      return { ok: false, error: "Backblaze B2 could not be reached." };
    }
  },
  async createCineStripeCheckout() {
    if (!billingReady()) return { ok: false, error: "Billing needs server configuration before checkout is available." } as const;
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": configValue("STRIPE_CINE_PRICE_ID"),
      "line_items[0][quantity]": "1",
      success_url: configValue("CINE_STRIPE_SUCCESS_URL"),
      cancel_url: configValue("CINE_STRIPE_CANCEL_URL"),
      client_reference_id: "cine-workspace-1",
    });
    try {
      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${configValue("STRIPE_SECRET_KEY")}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const payload: unknown = await response.json();
      const parsed = z.object({ id: z.string(), url: z.string().url().nullable() }).safeParse(payload);
      if (!response.ok || !parsed.success || !parsed.data.url) return { ok: false, error: "Stripe checkout could not be started." } as const;
      return { ok: true, url: parsed.data.url, session_id: parsed.data.id } as const;
    } catch {
      return { ok: false, error: "Stripe checkout could not be reached." } as const;
    }
  },
  async verifyCineStripeCheckout(args) {
    if (!billingReady()) return { paid: false, quota_bytes: FREE_QUOTA_BYTES, error: "Billing is not configured." };
    try {
      const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${awsEncode(args.session_id)}`, {
        headers: { Authorization: `Bearer ${configValue("STRIPE_SECRET_KEY")}` },
      });
      const payload: unknown = await response.json();
      const parsed = z.object({ payment_status: z.string() }).safeParse(payload);
      const quotaBytes = Number(configValue("CINE_PAID_QUOTA_BYTES"));
      if (!response.ok || !parsed.success || parsed.data.payment_status !== "paid") {
        return { paid: false, quota_bytes: FREE_QUOTA_BYTES, error: "Stripe has not confirmed payment." };
      }
      return { paid: true, quota_bytes: quotaBytes, error: null };
    } catch {
      return { paid: false, quota_bytes: FREE_QUOTA_BYTES, error: "Stripe payment verification could not be reached." };
    }
  },
});
