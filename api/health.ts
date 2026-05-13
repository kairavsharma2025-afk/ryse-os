import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Cheap diagnostics endpoint — reports whether the backend env vars are wired
 *  (booleans only, never the values). Hit /api/health after deploying. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    authMode: 'pairing-code',
    databaseConfigured: Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL),
    time: new Date().toISOString(),
  })
}
