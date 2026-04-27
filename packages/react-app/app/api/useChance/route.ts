import { NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"

function getMidnight() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
}

export async function POST(req: Request) {
    try {
        const { wallet } = await req.json()

        const ref = db.ref(`users/${wallet}`)
        const snap = await ref.get()
        if (!snap.exists()) {
            await ref.set({
                username: "Guest",
                chances: 1,
                lastReset: getMidnight()
            })
        }

        let data = snap.val()
        const today = getMidnight()

        // ?? DAILY RESET (MOVED TO BACKEND)
        if (data.lastReset < today) {
            data.chances = 1
            data.lastReset = today
        }

        if (data.chances <= 0) {
            return NextResponse.json({ success: false })
        }

        await ref.update({
            chances: data.chances - 1,
            lastReset: data.lastReset
        })

        return NextResponse.json({ success: true })

    } catch (err) {
        console.error(err)
        return NextResponse.json({ error: "Server error" }, { status: 500 })
    }
}