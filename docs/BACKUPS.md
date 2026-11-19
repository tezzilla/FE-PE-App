# Database backups

Production data (accounts, purchases, progress) lives in Neon Postgres, connected through Vercel.
There are two layers of protection:

1. **Neon point-in-time restore.** Built into Neon. How far back it reaches depends on your Neon plan;
   check it in the Neon console under your project's settings.
2. **Nightly encrypted backup** (`.github/workflows/backup.yml`). Runs every day at 08:37 UTC, dumps
   the whole database, encrypts it with your passphrase (AES-256), and keeps it as a private workflow
   artifact for 30 days. It doesn't depend on Neon, so it survives a deleted project or an expired
   restore window.

## Turn on the nightly backup (one time)

1. In Vercel, open fe-pe-app > Settings > Environment Variables and copy the value of
   `DATABASE_URL_UNPOOLED` (Production).
2. Make a long random passphrase (for example from a password manager) and store it somewhere safe
   outside GitHub. Without it, the backups can't be opened.
3. In GitHub, open the repository's Settings > Secrets and variables > Actions > New repository secret,
   and add:
   - `BACKUP_DATABASE_URL`: the connection string from step 1
   - `BACKUP_PASSPHRASE`: the passphrase from step 2
4. Open Actions > Database backup > Run workflow to make the first backup now. It should finish green
   with a `civilprep-db-...` artifact.

## Restore

1. In GitHub, open Actions > Database backup, pick a run, and download its artifact (a zip containing
   `civilprep-<date>.dump.enc`).
2. Decrypt it with OpenSSL (built into macOS and Linux; you'll be asked for the passphrase):

   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in civilprep-<date>.dump.enc -out civilprep.dump
   ```

3. Restore into a **new, empty** database first (for example a new Neon branch), never straight over
   production:

   ```bash
   pg_restore --no-owner --no-privileges --dbname "<connection string of the new database>" civilprep.dump
   ```

4. Check the data there (user count, recent purchases), then point the app at it by updating
   `DATABASE_URL` and `DATABASE_URL_UNPOOLED` in Vercel and redeploying.

The backup contains personal data (emails, password hashes, purchase history). Keep downloaded copies
encrypted, and delete them when you're done.
