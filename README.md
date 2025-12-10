# vibe-markdown

A modern, AI-powered Markdown editor built with Vue 3. Experience a seamless writing environment where you can edit text, preview changes in real-time, and collaborate with an AI assistant to enhance your content.

## Key Features

- 🔑 **Bring Your Own Key (BYOK)**: Securely use your own OpenAI-compatible API key. Your keys are stored locally in your browser and are never sent to any backend server.
- 🤖 **AI Real-time Modification**: Ask the AI to edit your document, fix typos, or rewrite sections. Changes are applied intelligently with diff highlighting so you can see exactly what changed.
- 💬 **AI Q&A Assistant**: Have a conversation with the AI about your content. Select text to ask specific questions or get context-aware suggestions.
- ⚡ **Live Preview**: Instant rendering of your Markdown content as you type.

---

## For Users

Ready to start writing? You can use the editor directly in your browser without installing anything.

**[Launch vibe-markdown on Github!](https://luyiourwong.github.io/vibe-markdown)**

### How to Use

1.  **Configure AI**: Click the **⚙️Settings** icon in the header. Enter your OpenAI API Key (or a compatible provider's key). You can also customize the API Endpoint and Model (e.g., GPT, Claude, etc.).
2.  **Write & Preview**: Type your Markdown in the left pane. The right pane updates instantly to show the rendered result.
3.  **Chat with AI**: Click the **💬AI Chat** button to open the assistant.
    - **Ask Questions**: Type any question about Markdown or your content.
    - **Edit Content**: Select a portion of text in the editor and ask the AI to "fix grammar" or "rewrite this to be more professional." The AI can directly modify the text for you.

---

## For Developers

If you want to contribute or run the project locally, follow these steps. The project uses Vue 3, Vite, and TailwindCSS.

### Project Setup

Ensure you have Node.js (v20+) installed.

```sh
npm install
```

### Development

Start the development server with hot-reload:

```sh
npm run dev
```

### Production Build

Compile and minify the application for production:

```sh
npm run build
```

### Quality Assurance

The project includes tools for code quality and testing:

- **Linting**: Check for code style issues.
  ```sh
  npm run lint
  # or fix issues automatically
  npm run lint:fix
  ```

- **Testing**: Run unit tests with Vitest.
  ```sh
  npm run test
