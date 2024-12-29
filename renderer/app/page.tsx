export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-primary-50/50 to-primary-100/50">
            <div className="text-center space-y-8 max-w-2xl mx-auto backdrop-blur-sm bg-white/30 p-12 rounded-2xl shadow-xl">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Welcome to Cereal!
                </h1>
                <p className="text-xl text-primary-700">
                    A real-time speech transcription and note-taking app.
                </p>
            </div>
        </main>
    )
}