
# YouTube Video Summarizer

A web application that generates summaries, key topics, and visual mind maps from YouTube video content using AI.

## Features

- **Video Analysis**: Extract meaningful content from YouTube videos using their transcripts
- **AI-Powered Summaries**: Generate concise summaries with TL;DR, key topics, and subtopics
- **Visual Mind Maps**: View the video content as an interactive mind map for better understanding
- **Multiple AI Providers**: Support for both OpenAI and Google Gemini API services
- **Client-Side Only**: All processing happens in the browser with no server-side storage of API keys

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Shadcn UI components
- ReactFlow for interactive mind maps
- YouTube Transcript API

## Privacy & Security

- API keys are stored **only** in your browser's localStorage
- No server-side storage or processing of API credentials
- Keys never leave your device and are not transmitted to any third parties other than the selected AI provider

## Getting Started

### Prerequisites

- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Installation

```sh
# Clone the repository
git clone https://github.com/yourusername/youtube-video-summarizer.git

# Navigate to the project directory
cd youtube-video-summarizer

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Configuration

1. Obtain an API key from either:
   - [OpenAI](https://platform.openai.com/api-keys)
   - [Google AI Studio](https://ai.google.dev/) for Gemini

2. Enter your API key in the application's configuration section
   - The key will be stored only in your browser's localStorage
   - You can remove the key at any time

## Usage

1. Configure your preferred AI provider and enter your API key
2. Paste a YouTube video URL in the input field
3. Click "Summarize" to process the video
4. View the generated summary in either text format or as an interactive mind map
5. Click on timestamps to jump to specific sections of the video

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [ReactFlow](https://reactflow.dev/) for the interactive graph visualization
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful component library
- [YouTube Transcript API](https://github.com/jdepoix/youtube-transcript-api) for transcript extraction

