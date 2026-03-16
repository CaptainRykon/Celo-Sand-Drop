"use client"

import { useEffect } from "react"

export default function Home() {

    useEffect(() => {

        const handleUnityMessage = async (event: any) => {

            const data = event.data

            if (!data) return

            switch (data.type) {

                case "UNITY_PAY_GAMEPLAY":

                    await payGameplayEntry()

                    break

                case "UNITY_SUBMIT_SCORE":

                    console.log("Score:", data.score)

                    break

            }

        }

        window.addEventListener("message", handleUnityMessage)

        return () => {
            window.removeEventListener("message", handleUnityMessage)
        }

    }, [])



    async function payGameplayEntry() {

        if (!window.ethereum) {
            alert("MiniPay wallet not detected")
            return
        }

        try {

            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts"
            })

            const user = accounts[0]

            const tx = {
                from: user,
                to: "0xafFb98DeCfc3e1E7867fA412Bf9580E377bE265a",
                value: "0x0"
            }

            await window.ethereum.request({
                method: "eth_sendTransaction",
                params: [tx]
            })

            console.log("Gameplay payment sent")

        }
        catch (err) {
            console.log(err)
        }

    }



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