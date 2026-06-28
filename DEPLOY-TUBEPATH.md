# Deploy TubePath to tubepath.org

Everything below is pre-filled for **tubepath.org**. You only paste secrets from your local `.env.local` and flip a few switches in Namecheap / Google / Stripe.

---

## 1. Push to GitHub (one time)

In PowerShell, from the project folder:

```powershell
cd C:\Users\rrthe\Projects\tubepath
git init
git add .
git commit -m "Deploy tubepath.org"
```

Create an empty repo on GitHub (e.g. `tubepath`), then:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/tubepath.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy on Vercel (≈5 min)

1. Go to [vercel.com/new](https://vercel.com/new) → import your GitHub repo.
2. **Do not change** framework (Next.js) or build settings.
3. Open **Environment Variables → Production** and add every var from [`.env.production.example`](.env.production.example), filling in secrets from your `.env.local`:
   - `GEMINI_API_KEY`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `STRIPE_*` (all four)
   - `SESSION_SECRET` — use a **new** long random string for production (not your dev one)
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
4. `NEXT_PUBLIC_APP_URL` is already `https://tubepath.org` in the template — leave it.
5. Click **Deploy**.

`vercel.json` already redirects **www.tubepath.org → tubepath.org**.

---

## 3. Namecheap DNS (pick one)

### Option A — Easiest: Vercel nameservers

1. Vercel → your project → **Settings → Domains** → add `tubepath.org` and `www.tubepath.org`.
2. Vercel shows two nameservers (e.g. `ns1.vercel-dns.com`).
3. Namecheap → **Domain List → tubepath.org → Manage → Nameservers** → **Custom DNS** → paste Vercel’s nameservers → Save.

Done. SSL is automatic on Vercel.

### Option B — Keep Namecheap DNS

Namecheap → **Advanced DNS**:

| Type  | Host | Value                 |
|-------|------|------------------------|
| A     | `@`  | `76.76.21.21`          |
| CNAME | `www`| `cname.vercel-dns.com` |

Then in Vercel Domains, add both hostnames and wait for “Valid Configuration”.

---

## 4. Google OAuth (copy-paste)

[Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth client:

**Authorized JavaScript origins**

```
https://tubepath.org
```

**Authorized redirect URIs**

```
https://tubepath.org/api/auth/callback/google
```

Save. (You do **not** need to set `GOOGLE_REDIRECT_URI` in Vercel — the app derives it from `NEXT_PUBLIC_APP_URL`.)

---

## 5. Stripe webhook (if using real billing)

[Stripe → Webhooks](https://dashboard.stripe.com/webhooks) → Add endpoint:

```
https://tubepath.org/api/billing/webhook
```

Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.

Copy the new **signing secret** into Vercel as `STRIPE_WEBHOOK_SECRET`, then redeploy.

---

## 6. Verify

- [ ] https://tubepath.org loads
- [ ] https://www.tubepath.org redirects to https://tubepath.org
- [ ] Settings → Connect YouTube works
- [ ] Settings → AI engine → Live AI (if Gemini configured)
- [ ] Data survives refresh (Supabase)

---

## Phone: Add to Home Screen

Open **https://tubepath.org** on your phone:

- **iPhone:** Safari → Share → **Add to Home Screen**
- **Android:** Chrome menu → **Add to Home screen**

The app ships a web manifest and icon for a full-screen, app-like experience.

---

## Local dev (unchanged)

Keep `.env.local` with `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Production uses Vercel env vars only; they don’t affect local `npm run dev`.
