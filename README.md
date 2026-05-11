# AssignHub

AssignHub is a modern, comprehensive assignment management platform designed for students, teachers, and administrators. It streamlines the educational workflow by providing intuitive dashboards, robust tracking, and secure authentication.

## 🚀 Features

- **🎓 For Students**: Track assignments, submit drafts, and view progress through a calendar-based interface.
- **👩‍🏫 For Teachers**: Review submissions, provide feedback, and generate detailed academic reports.
- **🛠️ For Admins**: Manage user enrollments, system configurations, and platform settings.
- **🔐 Secure Authentication**: Integrated Google OAuth for seamless sign-in.
- **☁️ Media Integration**: Powered by Cloudinary for robust file handling and cloud storage.
- **🌓 Dark Mode**: Premium UI with full dark mode support across all modules.

## 📁 Project Structure

The project is organized into a client-server architecture:

- `/client`: Frontend built with React, TypeScript, Vite, and Tailwind CSS.
- `/server`: Backend built with Node.js, Express, and TypeScript.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Cloudinary Account (for media uploads)
- Google Cloud Console Project (for OAuth)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repository-url>
   cd AssignHub
   ```

2. Install dependencies for both client and server:
   ```bash
   # Root directory
   cd client && npm install
   cd ../server && npm install
   ```

3. Configure Environment Variables:
   - Create a `.env` file in both `client/` and `server/` directories based on the provided `.env.example` files.
   - **Note**: Never commit your `.env` files to the repository.

### Running the Application

1. Start the Backend Server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the Frontend Client:
   ```bash
   cd client
   npm run dev
   ```

## 📄 License

This project is licensed under the MIT License.
