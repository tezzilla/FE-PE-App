# Deploying CivilPrep (Vercel + Neon Postgres)

Production uses Postgres; local development keeps SQLite. The `vercel-build` script generates a
Postgres version of `prisma/schema.prisma`, creates or updates the tables, then builds the site.

## 1. Create the Vercel project
1. Sign in at vercel.com with GitHub.
2. **Add New → Project**, import `tezzilla/fe-pe-app`. Grant Vercel access to the repo if asked.
3. Open **Build and Output Settings**, turn on the override for **Build Command**, and enter:
   `npm run vercel-build`
4. Click **Deploy**. **The first deploy is expected to fail**: there is no database yet.

Vercel's free Hobby plan is for non-commercial use. Move to Pro before you charge subscribers.

## 2. Add the database
1. In the project: **Storage → Create Database → Neon** (Postgres). Accept the defaults.
2. Connect it to the project for **all environments**.
3. Check **Settings → Environment Variables**: `DATABASE_URL` must exist. If `DATABASE_URL_UNPOOLED`
   exists too, the build uses it for table changes automatically.

## 3. Add the other settings
In **Settings → Environment Variables**, add for all environments:

| Name | Value |
|---|---|
| `AUTH_SECRET` | A random string of 32+ characters. On Windows PowerShell: `[Convert]::ToBase64String((1..32 \| % {Get-Random -Max 256}))` |
| `APP_URL` | Your site address, e.g. `https://fe-pe-app.vercel.app` (no trailing slash) |
| `REVIEWER_EMAILS` | Your email. Comma-separate to add more reviewers. |
| `CONTACT_EMAIL` | Public address for legal and privacy requests, shown on the Terms and Privacy pages. |
| `POSTMARK_SERVER_TOKEN` | Postmark > Servers > your server > API Tokens. Mark Sensitive. Sends password reset, welcome and password-changed emails. |
| `EMAIL_FROM` | A sender you verified in Postmark (Sender Signatures or a verified domain), e.g. `CivilPrep <support@yourdomain.com>`. |

Never commit these values to git. Changing `AUTH_SECRET` later signs everyone out.

## 4. Redeploy
**Deployments → latest → ⋯ → Redeploy.** When it shows **Ready**, open the site, sign up with your
reviewer email, and approve question types under **Review**. Production starts with an empty
database, so nothing generated is live until you approve it.

## 5. Point the phone app at the live site
In the `mobile` folder:
```powershell
$env:EXPO_PUBLIC_API_URL="https://YOUR-SITE.vercel.app"
npx expo start --clear
```
The app then works on any network, not just your home Wi-Fi.

## Subscriptions
Stripe setup is in **docs/STRIPE.md**. In short: run `npm run stripe:setup` with your key to create the
products, prices, webhook and Customer Portal, then set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
in Vercel and redeploy. No price IDs needed. Until Stripe is configured, the pricing page shows
"Subscriptions open soon".

## Every later update
Push to the branch Vercel watches; it redeploys automatically. Schema changes are applied by
`prisma db push` during the build, which refuses changes that would delete data.
