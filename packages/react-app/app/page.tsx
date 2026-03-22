"use client"

import { useEffect } from "react"
import { saveScore, getLeaderboard } from "@/lib/Leaderboard"
import { encodeFunctionData } from "viem"

const CONTRACT = "0xafFb98DeCfc3e1E7867fA412Bf9580E377bE265a"
const USDT = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e"
import { initUser, getUser, consumeChance, addChances } from "@/lib/chances"

export default function Home() {
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

                case "UNITY_INIT_USER":
                    await handleInitUser(data)
                    break

                case "UNITY_GET_USER":
                    await handleGetUser()
                    break

                case "UNITY_USE_CHANCE":
                    await handleUseChance()
                    break

                case "UNITY_BUY_CHANCES":
                    console.log("🔥 UNITY_BUY_CHANCES RECEIVED");
                    await handleBuyChances()
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
                alert("Wrong network")
                return
            }
       
            // =========================
            // STEP 1: APPROVE (ONLY ONCE)
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

            await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: user,
                    to: USDT,
                    data: approveData
                }]
            })

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

            const tx = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: user,
                    to: CONTRACT,
                    data: payData
                }]
            })

            await waitForTx(tx)

            sendToUnity("OnPaymentSuccess", "")

        } catch (err) {
            console.error("❌ Payment failed:", err)
        }
    }

    async function getWallet() {
        let accounts = await window.ethereum.request({
            method: "eth_accounts"
        })

        if (!accounts || accounts.length === 0) {
            accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            })
        }

        return accounts[0]
    }

    async function handleInitUser(data: any) {
        const wallet = await getWallet()
        await initUser(wallet, data.username)
    }

    async function handleGetUser() {
        const wallet = await getWallet()
        const data = await getUser(wallet)

        if (!data) {
            console.warn("User not found → reinitializing")

            await handleInitUser({ username: "Guest" })

            const retry = await getUser(wallet)

            sendToUnity("OnUserData", JSON.stringify(retry))
            return
        }

        // ✅ THIS WAS MISSING
        sendToUnity("OnUserData", JSON.stringify(data))
    }


    async function handleUseChance() {
        const wallet = await getWallet()

        const success = await consumeChance(wallet)

        if (!success) {
            sendToUnity("OnChanceUsed", "0")
            return
        }

        // 🔥 GET UPDATED USER DATA
        const updated = await getUser(wallet)

        // 🔥 SEND FULL DATA BACK TO UNITY
        sendToUnity("OnUserData", JSON.stringify(updated))
    }

    const BUY_CONTRACT = "0xa4303482605aAEB0bAC78F184f2f132D5e8A132F"

    const BUY_ABI = [
        {
            inputs: [],
            name: "pay",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function"
        }
    ]

    async function handleBuyChances() {
        const success = await buyChancesPayment()
        if (!success) return

        const wallet = await getWallet()

        await addChances(wallet, 3)

        // 🔥 GET UPDATED USER DATA
        const updated = await getUser(wallet)

        // 🔥 SEND FULL DATA
        sendToUnity("OnUserData", JSON.stringify(updated))
    }

    async function buyChancesPayment() {
        try {
            console.log("🔥 Starting Buy Payment");

            const [user] = await window.ethereum.request({
                method: "eth_requestAccounts"
            })

            // =========================
            // STEP 1: APPROVE (FIX)
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
                args: [BUY_CONTRACT, BigInt(50000)]
            })

            console.log("🔥 Approving USDT...");

            const approveTx = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: user,
                    to: USDT,
                    data: approveData
                }]
            })
            
            await waitForTx(approveTx)

            // =========================
            // STEP 2: PAY
            // =========================
            const payData = encodeFunctionData({
                abi: BUY_ABI,
                functionName: "pay",
                args: []
            })

            console.log("🔥 Sending Pay TX...");

            const tx = await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: user,
                    to: BUY_CONTRACT,
                    data: payData
                }]
            })

            console.log("🔥 TX SENT:", tx);

            await waitForTx(tx)

            console.log("🔥 PAYMENT SUCCESS");

            return true
        } catch (err) {
            console.error("❌ BUY FAILED:", err);
            return false
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