"use client"

import { useEffect } from "react"
import { saveScore, getLeaderboard } from "@/lib/Leaderboard"
import { encodeFunctionData } from "viem"

const CONTRACT = "0xafFb98DeCfc3e1E7867fA412Bf9580E377bE265a"
const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e"
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

            const [user] = await window.ethereum.request({
                method: "eth_requestAccounts"
            })

            const chainId = await window.ethereum.request({
                method: "eth_chainId"
            })

            if (chainId !== "0xa4ec") {
                alert("Please switch MiniPay to CELO Mainnet")
                return
            }

            // =========================
            // STEP 1: APPROVE
            // =========================

            const approveData = encodeFunctionData({
                abi: [{
                    name: "approve",
                    type: "function",
                    stateMutability: "nonpayable",
                    inputs: [
                        { name: "spender", type: "address" },
                        { name: "amount", type: "uint256" }
                    ],
                    outputs: []
                }],
                functionName: "approve",
                args: [CONTRACT, BigInt(50000)]
            })

            const approveTx = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: user,
                    to: USDT,
                    data: approveData
                }]
            })

            console.log("Approve TX:", approveTx)

            // ✅ WAIT FOR CONFIRMATION (IMPORTANT)
            await waitForTx(approveTx)

            // =========================
            // STEP 2: PAY
            // =========================

            const payData = encodeFunctionData({
                abi: [{
                    name: "pay",
                    type: "function",
                    stateMutability: "nonpayable",
                    inputs: [],
                    outputs: []
                }],
                functionName: "pay",
                args: []
            })

            const payTx = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: user,
                    to: CONTRACT,
                    data: payData
                }]
            })

            console.log("Pay TX:", payTx)

            await waitForTx(payTx)

            alert("Payment success ✅")

            sendToUnity("OnPaymentSuccess", "")

        } catch (err) {
            console.error("❌ Payment failed:", err)
            alert(JSON.stringify(err))
        }
    }

    async function waitForTx(txHash: string) {
        while (true) {
            const receipt = await window.ethereum.request({
                method: "eth_getTransactionReceipt",
                params: [txHash]
            })

            if (receipt) return receipt

            await new Promise(r => setTimeout(r, 2000))
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