/**
 * Shared types for the native social-posting subsystem.
 *
 * The design is deliberately platform-agnostic: every network implements
 * the same small SocialPlatform interface, and the calling code
 * (/api/social/post, /api/cron/social-advocacy-post, etc.) never knows
 * which platform it is talking to.
 *
 * Rollout gate lives in platform-registry.ts — only `twitter` is enabled
 * at launch. Every other platform has an adapter stub that throws
 * "platform not yet enabled" so the UI Connect button can be rendered
 * disabled while the plumbing is already in place.
 */

export const SUPPORTED_PLATFORMS = [
  "twitter",
  "facebook",
  "instagram",
  "linkedin",
  "tiktok",
  "youtube",
] as const;

export type Platform = (typeof SUPPORTED_PLATFORMS)[number];

export function isPlatform(value: string): value is Platform {
  return (SUPPORTED_PLATFORMS as readonly string[]).includes(value);
}

/** Who owns a connection: brand-wide admin account, or a specific diviner. */
export type OwnerType = "admin" | "diviner";

export interface Owner {
  type: OwnerType;
  /** diviners.id when type === 'diviner'; null for admin (brand-wide). */
  id: string | null;
}

/**
 * The plaintext view of a `social_accounts` row. Used only inside the
 * server after token decryption — never returned to the client.
 */
export interface ConnectedAccount {
  id: string;
  owner: Owner;
  platform: Platform;
  platformAccountId: string;
  platformAccountHandle: string | null;
  platformAccountName: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  scopes: string[];
}

/** Safe (non-secret) projection of a connection — OK to return to the client. */
export interface PublicConnectedAccount {
  id: string;
  ownerType: OwnerType;
  ownerId: string | null;
  platform: Platform;
  platformAccountHandle: string | null;
  platformAccountName: string | null;
  connectedAt: string;
  lastPostAt: string | null;
  lastErrorAt: string | null;
  lastErrorMessage: string | null;
  tokenExpiresAt: string | null;
}

/** Content to post, as the calling code hands it to the adapter. */
export interface PostContent {
  /** The text of the post. Platforms with length limits will truncate. */
  text: string;
  /** Optional public image URL (we fetch and upload to the platform). */
  imageUrl?: string | null;
  /** Optional ISO-8601 timestamp for scheduled delivery. */
  scheduleAt?: string | null;
}

export interface PostResult {
  /** Platform-assigned post id (e.g. the tweet id). */
  platformPostId: string;
  /** Permalink to the live post, if the platform returns one. */
  permalink?: string | null;
  /**
   * If the platform queued the post for later delivery (true) vs.
   * published immediately (false).
   */
  scheduled: boolean;
}

/** Payload persisted after OAuth completes — pre-encryption. */
export interface NewConnectionPayload {
  owner: Owner;
  platform: Platform;
  platformAccountId: string;
  platformAccountHandle: string | null;
  platformAccountName: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  scopes: string[];
}

/**
 * Platform adapter contract. Every supported network implements this.
 * Disabled platforms implement it too but every method throws
 * `PlatformDisabledError` — the UI and the registry are the gatekeepers.
 */
export interface SocialPlatform {
  readonly id: Platform;
  readonly displayName: string;

  /**
   * Build the authorization URL the user should be redirected to.
   * Returns the URL AND anything the callback will need later
   * (e.g. the PKCE code_verifier). Caller persists those in
   * social_oauth_states keyed on `state`.
   */
  buildAuthorizeUrl(input: {
    state: string;
    redirectUri: string;
  }): Promise<{ url: string; codeVerifier?: string }>;

  /** Exchange an auth code for tokens and return the normalized connection. */
  exchangeCode(input: {
    code: string;
    codeVerifier?: string | null;
    redirectUri: string;
  }): Promise<Omit<NewConnectionPayload, "owner">>;

  /** Refresh an access token using the stored refresh token. */
  refreshAccessToken(account: ConnectedAccount): Promise<{
    accessToken: string;
    refreshToken: string | null;
    tokenExpiresAt: Date | null;
    scopes: string[];
  }>;

  /** Publish (or schedule) a post. */
  post(account: ConnectedAccount, content: PostContent): Promise<PostResult>;

  /** Best-effort token revocation (we always delete our row regardless). */
  revoke(account: ConnectedAccount): Promise<void>;
}

export class PlatformDisabledError extends Error {
  constructor(platform: Platform) {
    super(`Platform "${platform}" is not yet enabled`);
    this.name = "PlatformDisabledError";
  }
}

export class PlatformAuthError extends Error {
  constructor(message: string, public readonly platform: Platform) {
    super(message);
    this.name = "PlatformAuthError";
  }
}

export class PlatformPostError extends Error {
  constructor(
    message: string,
    public readonly platform: Platform,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PlatformPostError";
  }
}
