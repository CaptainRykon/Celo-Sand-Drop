"use client"

import { useEffect } from "react"
import { saveScore, getLeaderboard } from "@/lib/Leaderboard"

export default function Home() {

    useEffect(() => {

        const handleUnityMessage = async (event: any) => {

            const data = event.data
            if (!data) return

            switch (data.type) {

                // ?? PAYMENT
                case "UNITY_PAY_ENTRY":
                    await handlePayment()
                    break

                // ?? SAVE SCORE
                case "UNITY_SAVE_SCORE":
                    await handleSaveScore(data)
                    break

                // ?? GET LEADERBOARD
                case "UNITY_GET_LEADERBOARD":
                    await handleGetLeaderboard(data)
                    break
            }
        }

        window.addEventListener("message", handleUnityMessage)

        return () => {
            window.removeEventListener("message", handleUnityMessage)
        }

    }, [])

    // =========================
    // ?? PAYMENT FUNCTION
    // =========================
    async function handlePayment() {

        try {

            alert("Start payment")

            const accounts = await window.ethereum.request({
                method: "eth_accounts"
            })

            let user = accounts[0]

            if (!user) {
                const newAccounts = await window.ethereum.request({
                    method: "eth_requestAccounts"
                })
                user = newAccounts[0]
            }

            // ? Switch to CELO Alfajores
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0xaef3" }]
            })

            const tx = {
                from: user,
                to: "0xafFb98DeCfc3e1E7867fA412Bf9580E377bE265a",

                // ? 0.05 CELO
                value: "0x0B1A2BC2EC50000",

                // ? REQUIRED for MiniPay sometimes
                gas: "0x5208", // 21000
            }

            const result = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [tx]
            })

            alert("TX Success: " + result)

            sendToUnity("OnPaymentSuccess", "")

        } catch (err: any) {
            console.error("? Payment failed:", err)
            alert("Error: " + JSON.stringify(err))
        }
    }

    // =========================
    // ?? SAVE SCORE
    // =========================
    async function handleSaveScore(data: any) {

        try {
            await saveScore(data.gameName, data.username, data.score)

            console.log("?? Score saved to Firebase")

            sendToUnity("OnLeaderboardSaved", "")

        } catch (err) {
            console.log("? Save score failed:", err)
        }
    }

    // =========================
    // ?? GET LEADERBOARD
    // =========================
    async function handleGetLeaderboard(data: any) {

        try {
            const leaderboard = await getLeaderboard(data.gameName)

            console.log("?? Leaderboard:", leaderboard)

            sendToUnity("OnLeaderboardReceived", JSON.stringify(leaderboard))

        } catch (err) {
            console.log("? Fetch leaderboard failed:", err)
        }
    }

    // =========================
    // ?? SEND BACK TO UNITY
    // =========================
    function sendToUnity(method: string, value: string) {

        const iframe: any = document.querySelector("iframe")

        iframe?.contentWindow?.postMessage({
            type: "UNITY_CALLBACK",
            method,
            value
        }, "*")
    }

    // =========================
    // UI
    // =========================
    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <iframe
                src="/game/index.html"
                style={{
                    width: "100%",
                    height: "100%",
                    border: "none"
                }}
            />
        </div>
    )
}