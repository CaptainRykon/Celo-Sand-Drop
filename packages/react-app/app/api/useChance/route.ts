import { NextResponse } from "next/server"
import { db } from "@/lib/firebase-admin"

export async function POST(req: Request) {
    const { wallet } = await req.json()

    const ref = db.ref(`users/${wallet}`)
    const snap = await ref.get()

    if (!snap.exists()) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const data = snap.val()

    if (data.chances <= 0) {
        return NextResponse.json({ success: false })
    }

    await ref.update({
        chances: data.chances - 1
    })

    return NextResponse.json({ success: true })
}