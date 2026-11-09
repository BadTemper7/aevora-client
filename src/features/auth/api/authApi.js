import { nameFromEmail, wait } from "../../../utils/helpers";

/*
 * Mock auth service so the UI works without a backend.
 * To go live, swap each body for the matching call:
 *
 *   import { api } from "../../../services/api/axios";
 *   import { ENDPOINTS } from "../../../services/api/endpoints";
 *   const { data } = await api.post(ENDPOINTS.auth.login, { email, password });
 *   return data; // -> { user, token }
 */

export async function login({ email }) {
  await wait(700);

  const name = nameFromEmail(email);
  const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "");

  return {
    token: "mock-token",
    user: { id: crypto.randomUUID(), name, username, email: email.trim() },
  };
}

export async function register({ name, username, email }) {
  await wait(900);

  return {
    token: "mock-token",
    user: { id: crypto.randomUUID(), name: name.trim(), username, email: email.trim() },
  };
}
