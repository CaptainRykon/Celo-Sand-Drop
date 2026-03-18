import { ref, push, get } from "firebase/database"
import { db, authReady } from "./firebase"

export async function saveScore(gameName: string, username: string, score: number) {
    await authReady

    await push(ref(db, `leaderboards/${gameName}`), {
        username,
        score,
        timestamp: Date.now()
    })
}

export async function getLeaderboard(gameName: string) {
    await authReady

    const snapshot = await get(ref(db, `leaderboards/${gameName}`))

    if (!snapshot.exists()) return []

    const data = snapshot.val()

    return Object.values(data)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 10)
}