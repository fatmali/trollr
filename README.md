# Troll - Developer-Focused Todo App

Troll is a developer-focused todo app with built-in AI trolling to motivate productivity. It combines task management with a pomodoro timer and uses LLMs to generate sarcastic, motivational messages.

## Features

- **Task Management System**: Create, read, update and delete tasks with properties like title, description, deadline, priority, tags, and status
- **Pomodoro Timer**: Configurable work/break intervals with visual progress indicator and session tracking
- **AI Trolling System**: Sarcastic AI-generated messages based on your productivity patterns
- **Developer-Specific Features**: Code snippet support in tasks and technical deadline motivation

## Technology Stack

- **Frontend**: Next.js with TypeScript and App Router
- **Styling**: Tailwind CSS
- **State Management**: Zustand for local state
- **Data Persistence**: Local storage (with planned Azure Cosmos DB integration)
- **AI Integration**: Placeholder implementation (with planned Azure Functions and Ollama integration)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
2. Install dependencies
```bash
npm install
```
3. Start the development server
```bash
npm run dev
```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/src
  /app      # Next.js App Router
  /components
    /tasks  # Task-related components
    /pomodoro # Pomodoro timer components
    /troll  # Troll messaging components
    /ui     # Reusable UI components
  /context  # React contexts
  /hooks    # Custom React hooks
  /lib      # Utility functions
    /azure  # Azure function clients
    /llm    # LLM integration
    /db     # Database utilities
  /services # Service layer
  /types    # TypeScript type definitions
```

## Future Enhancements

- **Azure Integration**: Connect to Azure Functions for LLM processing
- **Cosmos DB**: Implement data persistence with Azure Cosmos DB
- **Ollama Integration**: Connect to Ollama for local LLM processing
- **GitHub Integration**: Connect to GitHub for task tracking
- **Settings Customization**: More options for Pomodoro settings and trolling intensity

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
