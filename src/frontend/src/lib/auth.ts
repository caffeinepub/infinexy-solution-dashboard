export interface SessionUser {
  role: "admin" | "executive";
  username: string;
  name: string;
}

export function getSession(): null {
  // Session lives in React state only — clears on page refresh
  return null;
}
