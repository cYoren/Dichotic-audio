# Dichotic Listening Trainer

A client-side web application for dichotic listening training, designed for users with Autism Spectrum Disorder (ASD) and Central Auditory Processing Disorder (CAPD).

## Features

- **Independent Ear Control**: Load different audio tracks for left and right ears (file upload or URL).
- **Background Noise**: built-in White/Pink noise generation or custom noise file.
- **Advanced Mixing**: Individual volume controls, master volume, and noise masking.
- **Difficulty Presets**: Beginner, Intermediate, and Advanced settings for easy progression.
- **Privacy Focused**: All audio processing happens locally in the browser using the Web Audio API. No data is sent to any server.

## Requirements

- Node.js 20+ (Recommended)
- Modern Web Browser (Chrome, Firefox, Safari, Edge)

## Getting Started

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open the URL shown in the terminal (usually `http://localhost:5173`).

3.  **Build for Production**
    ```bash
    npm run build
    npm run preview
    ```

## Usage

1.  **Load Audio**: Use the "Left Ear" and "Right Ear" sections to upload audio files or paste URLs.
2.  **Configure**: Adjust volumes or select a difficulty preset.
3.  **Play**: Use the transport controls to start the session.
4.  **Train**: Focus on the specific instructions provided by your therapist (e.g., "ignore the right ear", "focus on the left").

## Disclaimer

This tool is for educational and training purposes only. It is not a medical device. Please consult a qualified professional for diagnosis and therapy.

