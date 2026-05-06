const LEADERBOARD_TTL_MS = 60_000

type LeaderboardEntry = {
  username?: string
  score?: number
  timestamp?: number
}

type CacheEntry = {
  data: LeaderboardEntry[]
  expiresAt: number
  inflight?: Promise<LeaderboardEntry[]>
}

const leaderboardCache = new Map<string, CacheEntry>()

function normalizeLeaderboard(data: unknown): LeaderboardEntry[] {
  if (!Array.isArray(data)) return []

  return data
    .filter((entry: any) => entry && typeof entry.score === "number")
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 50)
}

export async function saveScore(
  gameName: string,
  wallet: string,
  username: string,
  score: number
) {
  const res = await fetch("/api/saveScore", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      gameName,
      wallet,
      username,
      score,
    }),
  })

  leaderboardCache.delete(gameName)

  if (!res.ok) {
    throw new Error("Failed to save score")
  }
}

export async function getLeaderboard(gameName: string) {
  const now = Date.now()
  const cached = leaderboardCache.get(gameName)

  if (cached?.data && cached.expiresAt > now) {
    return cached.data
  }

  if (cached?.inflight) {
    return cached.inflight
  }

  const inflight = (async () => {
    const res = await fetch("/api/getLeaderboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameName }),
    })

    if (!res.ok) {
      leaderboardCache.delete(gameName)
      return []
    }

    const data = normalizeLeaderboard(await res.json())

    leaderboardCache.set(gameName, {
      data,
      expiresAt: Date.now() + LEADERBOARD_TTL_MS,
    })

    return data
  })()

  leaderboardCache.set(gameName, {
    data: cached?.data ?? [],
    expiresAt: 0,
    inflight,
  })

  return inflight
}
