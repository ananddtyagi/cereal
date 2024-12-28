# Cereal 🎙️

Cereal is a real-time speech transcription and note-taking app built with Electron and Next.js.

## Features

- Real-time speech transcription
- Desktop application for macOS, Windows, and Linux
- Built with modern web technologies
- Microphone and screen capture capabilities

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cereal.git
cd cereal
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

## Development

To run the app in development mode:

```bash
npm run dev
# or
yarn dev
```

This will:
- Start the Next.js development server
- Launch the Electron app once the Next.js server is ready
- Enable hot-reload for both frontend and Electron processes

## Building

To build the application:

```bash
npm run build
# or
yarn build
```

## Packaging

To package the app for distribution:

```bash
npm run package
# or
yarn package
```

To create platform-specific distributables:

```bash
npm run make
# or
yarn make
```

## Tech Stack

- Electron
- Next.js 14
- React 18
- TypeScript
- Electron Forge (for building and packaging)

## License

[MIT License](LICENSE)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
