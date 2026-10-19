---
title: "Google sign-in plus JWT in a MERN app without losing the session"
description: "Just Rent It let people sign up with Google or with a password. Making both paths produce the same session, link to the same account, and survive a page reload took a few wrong turns. Here is the flow that works, with the token verified on the server."
date: 2027-02-08T03:30:00Z
tags: [oauth, express, jwt, react, security]
keywords: [google oauth express jwt, google sign in react node, verify google id token server, google oauth mern stack, link google account existing user]
project: justrentit
image: /blog/stock/fingerprint-1.webp
imageAlt: "Fingerprint scan illustration in blue"
imageCredit: "mikemacmarketing"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Fingerprint_Scanner.jpg"
imageLicense: "CC BY 2.0"
---

"Sign in with Google" is one button for the user and three decisions for you: where the Google token is verified, how a Google user becomes a user in your database, and what session they get afterwards. Just Rent It got the first decision wrong initially, trusting the browser's claim about who had signed in. This is the corrected flow.

## The flow

1. The browser gets an ID token from Google's sign-in library.
2. The browser posts that ID token to your API.
3. The API verifies the token with Google's public keys, reads the email and Google user id, and finds or creates the user.
4. The API issues the same access and refresh tokens it issues for password logins.

The browser never decides who the user is. Only step 3 does.

## Browser: get the ID token

With Google Identity Services, render the button and receive a credential:

```tsx
useEffect(() => {
  google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: async ({ credential }) => {
      const res = await fetch(`${API}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ credential }),
      });
      const { accessToken } = await res.json();
      setAccessToken(accessToken);
    },
  });
  google.accounts.id.renderButton(buttonRef.current, { theme: "outline", size: "large" });
}, []);
```

`credentials: "include"` matters: the refresh token arrives as an `httpOnly` cookie, and the browser only stores it if you ask.

## Server: verify, then find or create

```js
import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post("/auth/google", async (req, res) => {
  const ticket = await client.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID });
  const p = ticket.getPayload();
  if (!p?.email_verified) return res.status(401).json({ error: "Email not verified with Google" });

  let user = await User.findOne({ $or: [{ googleId: p.sub }, { email: p.email.toLowerCase() }] });
  if (!user) {
    user = await User.create({ email: p.email.toLowerCase(), name: p.name, avatar: p.picture, googleId: p.sub, role: "user" });
  } else if (!user.googleId) {
    user.googleId = p.sub;            // link Google to an existing password account
    await user.save();
  }

  return issueSession(res, user);     // same helper the password login uses
});
```

Three points. `verifyIdToken` checks the signature, expiry and audience; without `audience` a token minted for someone else's app would pass. `email_verified` must be true before you link by email, or a Google account with an unverified claim to an address could take over the account that owns it. And `issueSession` is shared with the password route, so there is one kind of session in the whole app.

## Linking accounts

Someone who signed up with a password and later clicks Google should land in the same account, which the lookup above does by email. The reverse, adding a password to a Google-only account, goes through the normal "set password" flow once they are logged in. Never let a Google login create a second account for an email that already exists; duplicate accounts are the support ticket that never ends.

## Surviving a reload

The access token lives in memory and is gone on reload. On app start, call `/auth/refresh` with the cookie; if it succeeds you have a new access token and the user is still signed in. The Google button is never shown to a user who already has a valid refresh cookie, so people do not get asked twice.

```ts
export async function bootstrapSession() {
  const res = await fetch(`${API}/auth/refresh`, { method: "POST", credentials: "include" });
  return res.ok ? (await res.json()).accessToken : null;
}
```

## Settings that trip people up

- **Authorized JavaScript origins** in the Google Cloud console must include every origin you use: `http://localhost:5173` for development, your production domain, and `capacitor://localhost` if the app ships as a Capacitor build.
- **The client ID is public**; the client secret is not needed for this ID-token flow at all. If a tutorial asks you to put the secret in the browser, close the tab.
- **Cookie `SameSite`**. `strict` breaks the redirect-based flow but is fine for the pop-up flow used here. If you switch to redirects, use `lax`.

## Sources

- Google Identity Services, sign in with Google for web: [developers.google.com/identity/gsi/web/guides/overview](https://developers.google.com/identity/gsi/web/guides/overview)
- Verifying the ID token on the server: [developers.google.com/identity/gsi/web/guides/verify-google-id-token](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)
- google-auth-library for Node: [github.com/googleapis/google-auth-library-nodejs](https://github.com/googleapis/google-auth-library-nodejs)
- OWASP authentication cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
