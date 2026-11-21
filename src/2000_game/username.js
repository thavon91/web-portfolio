export function usernameToEmail(value) {
  const username = value.trim().toLowerCase().replace(/@hex\.com$/, '');
  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    throw new Error('Use a username of 3–32 letters, numbers, or underscores, or its @hex.com email.');
  }
  return `${username}@hex.com`;
}
