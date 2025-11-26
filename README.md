# WB Project Opportunity Analyzer

A full-stack web application for World Bank ITS Innovation Labs to identify technology business opportunities in World Bank lending projects.

## Features

- **Search & Filter**: Search World Bank projects by region, status, year range, and keywords
- **AI-Powered Scoring**: Score projects for technology opportunity relevance using GPT-4 or Claude models
- **Report Generation**: Generate comprehensive opportunity reports for selected projects
- **Demo Mode**: Works without API keys using intelligent demo scoring
- **Real-time Data**: Fetches live data from World Bank APIs

## Tech Stack

- **Frontend**: React 18 (via CDN), Tailwind CSS
- **Backend**: Node.js with Express
- **APIs**: World Bank Projects API, OpenAI, Anthropic Claude

## Getting Started

### Prerequisites

- Node.js 18+ installed
- (Optional) OpenAI or Anthropic API key for AI scoring

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

You need to run both the backend server and frontend:

**Terminal 1 - Backend Server:**
```bash
npm run server
```
Server runs on http://localhost:3001

**Terminal 2 - Frontend Dev Server:**
```bash
npm run dev
```
Frontend runs on http://localhost:5173

### Usage

1. Open http://localhost:3001 in your browser
2. Use filters to search World Bank projects
3. Select projects using checkboxes
4. Click "Score Selected" to analyze projects (works in demo mode without API keys)
5. Click "Generate Report" to create an opportunity report
6. Configure API keys in Settings (gear icon) for enhanced AI scoring

## Configuration

### Settings Panel

Access via the gear icon in the top-right corner:

1. **API Keys**: Add OpenAI or Anthropic API keys (optional - demo mode works without)
2. **Model Selection**: Choose between Demo, GPT-4o, GPT-4 Turbo, or Claude Sonnet 4
3. **Scoring Prompt**: Customize the AI prompt for project scoring
4. **Report Prompt**: Customize the AI prompt for report generation

### Demo Mode

The application works without API keys in demo mode:
- Automatically scores projects based on ICT sector alignment
- Generates structured reports with project summaries
- Great for testing and demonstrations

## API Endpoints

### Backend (Port 3001)

- `GET /api/projects` - Search World Bank projects
- `GET /api/documents/:projectId` - Get project documents
- `POST /api/score` - Score projects with AI
- `POST /api/report` - Generate opportunity report

## Building for Production

```bash
npm run build
```

## Project Structure

```
├── public/
│   └── index.html          # Single-page React application
├── server.cjs              # Express backend server
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## Notes

- The application gracefully falls back to demo data if World Bank API is unavailable
- All settings are stored in browser memory (reset on page refresh)
- Project scores are maintained during the session
- Links to World Bank project details open in new tabs

## License

Proprietary - World Bank ITS Innovation Labs
