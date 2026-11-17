// Usage: npm run make-reviewer -- you@example.com ["Credential text"]
import { PrismaClient } from "@prisma/client";

const [email, credential] = process.argv.slice(2);
if (!email) {
  console.error('Usage: npm run make-reviewer -- you@example.com ["Credential shown to students"]');
  process.exit(1);
}
const db = new PrismaClient();
db.user
  .update({
    where: { email: email.toLowerCase() },
    data: { role: "reviewer", ...(credential ? { reviewerCredential: credential } : {}) },
  })
  .then((u) => console.log(`${u.email} is now a reviewer`))
  .catch(() => {
    console.error(`No account for ${email}. Sign up on the site first.`);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
