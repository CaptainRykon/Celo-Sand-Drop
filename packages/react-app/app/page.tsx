import dynamic from "next/dynamic";

const GameClient = dynamic(() => import("@/components/GameClient"), {
    ssr: false, // 🚀 THIS FIXES YOUR ERROR
});

export default function Page() {
    return <GameClient />;
}