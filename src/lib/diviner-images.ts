export const DEFAULT_DIVINER_AVATAR = "/images/diviners/default-avatar.svg";
export const DEFAULT_DIVINER_BANNER = "/images/banners/diviner-banner.png";

export function getDivinerAvatarUrl(avatarUrl?: string | null): string {
  return avatarUrl?.trim() ? avatarUrl : DEFAULT_DIVINER_AVATAR;
}

export function getDivinerCoverImageUrl(coverImageUrl?: string | null): string {
  return coverImageUrl?.trim() ? coverImageUrl : DEFAULT_DIVINER_BANNER;
}
