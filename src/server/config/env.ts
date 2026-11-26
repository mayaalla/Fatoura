import "dotenv/config";
import { z } from "zod";

// Set these variables in your .env file (never commit real values here).
// Copy .env.example and fill in the values:
//
// RESEND_API=re_...
// DATABASE_URL=postgresql://...
// NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
// CLERK_SECRET_KEY=sk_...
// UPSTASH_REDIS_REST_URL=redis://...

// import here all env var and export them as a single object to be used in the app also use zod to validate them
// create strect rules and validation for each env var and throw an error if any of them is missing or invalid
const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    RESEND_API: z.string().min(1),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    CLERK_SECRET_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url(),
});

const env = envSchema.parse(process.env);

export default env;
