export const AVATAR_PATHS = Array.from(
  { length: 13 },
  (_, index) => `/avatars/avatar_${index + 1}.avif`,
)

export const DEFAULT_AVATAR_PATH = AVATAR_PATHS[0]
