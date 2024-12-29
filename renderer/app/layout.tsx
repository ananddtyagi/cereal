import './globals.css';
import SidePanel from '@/components/SidePanel';

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
        <html lang="en" className="h-full">
            <body className="bg-gradient-to-br from-primary-50 to-primary-100 min-h-screen">
                <div className="flex min-h-screen">
                    <SidePanel />
                    <main className="flex-1 transition-all duration-300">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    )
}
