export function usernameToEmail(value) {
  const username = value.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    throw new Error("Use a username of 3–32 letters, numbers, or underscores.");
  }
  return `${username}@uro.com`;
}

