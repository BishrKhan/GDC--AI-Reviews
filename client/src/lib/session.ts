const SESSION_USER_KEY = "prod-bot-session-user-id";

export function getSessionUserId() {
  const existing = window.localStorage.getItem(SESSION_USER_KEY);
  if (existing) {
    return existing;
  }

  const userId = `user-${window.crypto.randomUUID()}`;
  window.localStorage.setItem(SESSION_USER_KEY, userId);
  return userId;
}
