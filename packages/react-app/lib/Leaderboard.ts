
import { db, authReady } from "./firebase"

import { ref, get, set } from "firebase/database"

export async function saveScore(gameName: string, wallet: string, username: string, score: number) {
    await authReady

    const userRef = ref(db, `leaderboards/${gameName}/${wallet}`)

    const snapshot = await get(userRef)

    // ?? IF USER EXISTS
    if (snapshot.exists()) {
        const existing = snapshot.val()

        // ? ONLY UPDATE IF NEW SCORE IS HIGHER
        if (score > existing.score) {
            await set(userRef, {
                username,
                score,
                timestamp: Date.now()
            })
        }
    }
    else {
        // ?? NEW USER ENTRY
        await set(userRef, {
            username,
            score,
            timestamp: Date.now()
        })
    }
}

export async function getLeaderboard(gameName: string) {
    await authReady

    const snapshot = await get(ref(db, `leaderboards/${gameName}`))

    if (!snapshot.exists()) return []

    const data = snapshot.val()

    return Object.values(data)
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 50)
}