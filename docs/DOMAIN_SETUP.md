# Smesh Domain Setup Guide

> **Recommended domain:** `smesh.xyz` — clean, professional, ~$10/yr on Namecheap  
> **Why not smesh.ai?** Almost certainly taken or $1,000+/yr — not worth it.  
> **Why smesh.xyz?** `.xyz` is widely used in tech/Web3 (e.g., `xy.z` by Cloudflare). It reads professional and fits the brand.

---

## Step 1 — Register `smesh.xyz` on Namecheap

1. Go to [namecheap.com](https://www.namecheap.com)
2. Search for `smesh.xyz` in the search bar
3. Add to cart (~$10–13/yr)
4. Create an account or log in
5. At checkout, **disable** Namecheap WhoisGuard if they charge extra (it's usually free — keep it if free)
6. Complete purchase

---

## Step 2 — Add Custom Domain on Vercel

1. Go to your Vercel project dashboard → **Settings** → **Domains**
2. Click **Add**
3. Enter `smesh.xyz` and click **Add**
4. Also add `www.smesh.xyz` as a redirect to `smesh.xyz` (Vercel will prompt you)
5. Vercel will show you the DNS records to configure — see Step 3

---

## Step 3 — Configure DNS on Namecheap

1. In Namecheap dashboard → **Domain List** → click **Manage** next to `smesh.xyz`
2. Go to **Advanced DNS** tab
3. **Delete** the default `@` A record and `www` CNAME if present
4. Add the following records:

| Type  | Host | Value                   | TTL        |
|-------|------|-------------------------|------------|
| A     | @    | `76.76.21.21`           | Automatic  |
| CNAME | www  | `cname.vercel-dns.com`  | Automatic  |

5. Save all changes

> DNS propagation takes **2–48 hours** (usually under 30 min). You can check status at [dnschecker.org](https://dnschecker.org).

---

## Step 4 — Verify on Vercel

1. Go back to Vercel → Settings → Domains
2. Wait for the domain to show **✓ Valid Configuration**
3. Your site will be live at `https://smesh.xyz` 🎉

---

## Optional: Set Up Subdomain for API

If you later deploy a backend, add:

| Type  | Host | Value                          | TTL        |
|-------|------|--------------------------------|------------|
| CNAME | api  | `your-render-or-railway-url`   | Automatic  |

This gives you `api.smesh.xyz` for backend calls and update `NEXT_PUBLIC_API_URL=https://api.smesh.xyz` in Vercel environment variables.

---

## Checklist

- [ ] `smesh.xyz` registered on Namecheap
- [ ] Domain added in Vercel Settings → Domains
- [ ] A record `@` → `76.76.21.21` set in Namecheap Advanced DNS
- [ ] CNAME `www` → `cname.vercel-dns.com` set in Namecheap Advanced DNS
- [ ] DNS propagated (check [dnschecker.org](https://dnschecker.org))
- [ ] Vercel shows ✓ Valid Configuration
- [ ] Update `NEXT_PUBLIC_SITE_URL` env var in Vercel to `https://smesh.xyz`
