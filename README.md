AI-DRIVEN AUTOMATED SCHEDULER
Project Overview
This is an AI-driven automated scheduler application built with modern web technologies. The system intelligently manages and schedules tasks, meetings, and events using artificial intelligence algorithms.
Technologies Used
This project is built with:

Vite - Fast build tool and development server
TypeScript - Type-safe JavaScript development
React - Frontend UI library
shadcn-ui - Modern UI component library
Tailwind CSS - Utility-first CSS framework

Getting Started
Prerequisites

Node.js (v16 or higher)
npm or yarn package manager

You can install Node.js using nvm for easy version management.
Installation & Setup

Clone the repository
bashgit clone https://github.com/KNagaSaiSatyaTeja/AI-DRIVEN-AUTOMATED-SCHEDULER-2-
cd AI-DRIVEN-AUTOMATED-SCHEDULER-2-

Install dependencies
bashnpm install

Start the development server
bashnpm run dev
Important: The scheduler must run on port 8000. Make sure to configure your development server to use port 8000.
Build for production (when ready)
bashnpm run build


Development Workflow
Local Development

Important: The scheduler runs on http://localhost:8000
Hot module replacement (HMR) is enabled for instant updates
TypeScript compilation happens in real-time
All development and testing should be done locally before considering deployment

Code Structure
src/
├── components/     # React components
├── pages/         # Application pages
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
├── styles/        # Global styles
└── assets/        # Static assets
Running the Application
Development Mode
bashnpm run dev
This will start the scheduler at http://localhost:8000
Production Preview (Local)
bashnpm run build
npm run preview
This builds the application and serves it locally for testing production builds.
Features

AI-Powered Scheduling: Intelligent task and meeting scheduling
Real-time Updates: Live synchronization of schedule changes
Responsive Design: Works seamlessly on desktop and mobile devices
Type Safety: Full TypeScript support for better development experience
Modern UI: Built with shadcn-ui and Tailwind CSS for a polished interface

Local Development Notes

The application is currently configured for local development only
All data and configurations are stored locally
The scheduler must run on port 8000 for proper functionality
Ensure port 8000 is available before starting the development server

Troubleshooting
Port 8000 Already in Use
If port 8000 is occupied, you'll need to:

Stop the process using port 8000
Or configure your Vite settings to use port 8000

Installation Issues
bash# Clear npm cache if you encounter installation problems
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
Contributing

Fork the repository
Create a feature branch: git checkout -b feature-name
Make your changes and test locally at port 8000
Commit your changes: git commit -m "Add feature"
Push to your branch: git push origin feature-name
Create a pull request

License
This project is open source and available under the MIT License.
Contact
For questions or support, please open an issue on GitHub or contact the project maintainer.

This project demonstrates modern web development practices with AI integration for intelligent scheduling solutions. Currently optimized for local development at port 8000.
