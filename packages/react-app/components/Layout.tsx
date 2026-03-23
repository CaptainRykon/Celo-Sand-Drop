import '@/styles/globals.css'
import { AppProvider } from '@/providers/AppProvider'

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body style={{
                margin: 0,
                padding: 0,
                overflow: "hidden",
                height: "100vh",
                width: "100vw"
            }}>
                <AppProvider>
                    {children}
                </AppProvider>
            </body>
        </html>
    )
}