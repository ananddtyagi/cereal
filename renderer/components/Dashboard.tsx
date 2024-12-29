export default function Dashboard() {
    return (
        <div>
            <div className="text-center space-y-8 max-w-2xl mx-auto backdrop-blur-sm bg-white/30 p-12 rounded-2xl shadow-xl">
                <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    Welcome to Cereal!
                </h1>
                <p className="text-xl text-primary-700">
                    A real-time speech transcription and note-taking app.
                </p>
            </div>
        </div>
    );
}