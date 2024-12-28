export const metadata = {
    title: 'Cereal',
    description: 'A real-time speech transcription and note-taking app.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
