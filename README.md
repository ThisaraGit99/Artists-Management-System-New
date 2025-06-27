# 🎵 Artist Management System

A comprehensive full-stack web application for connecting artists with event organizers, built with React frontend and Node.js backend.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

The Artist Management System is a platform that facilitates connections between talented artists and event organizers. Artists can showcase their skills, manage bookings, and build their reputation, while organizers can discover artists, manage events, and handle bookings seamlessly.

## ✨ Features

### For Artists
- 🎨 Create detailed artist profiles
- 📦 Manage service packages and pricing
- 📅 Handle booking requests and availability
- ⭐ Build reputation through reviews
- 💰 Track earnings and performance

### For Event Organizers
- 🔍 Search and filter artists by genre, location, price
- 📋 Compare artist packages and portfolios
- 🎫 Manage events and bookings
- 💳 Secure booking and payment process
- 📊 Event management dashboard

### For Administrators
- 👥 User management and verification
- 📈 System analytics and reporting
- 🛡️ Platform moderation and security
- 💼 Business intelligence dashboard

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI Framework
- **React Router 6** - Client-side routing
- **Bootstrap 5** - UI Components
- **React Bootstrap** - React-specific Bootstrap components
- **Axios** - HTTP client
- **React Toastify** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Express Validator** - Input validation
- **CORS** - Cross-origin resource sharing

### Development Tools
- **Nodemon** - Development server
- **Jest** - Testing framework
- **Postman** - API testing

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Express API   │    │   MySQL DB      │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Port 3306)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MySQL** (v8.0 or higher) - [Download](https://mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **OS**: Windows 10, macOS 10.14+, or Linux

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/artist-management-system.git
cd artist-management-system
```

### 2. Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit the .env file with your configuration
# (See Configuration section below)
```

### 3. Setup Frontend

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

### 4. Setup Database

```bash
# Create MySQL database
mysql -u root -p

# In MySQL console:
CREATE DATABASE artist_management_system;
exit

# Import the database schema (from project root)
mysql -u root -p artist_management_system < database/schema.sql
```

## ⚙️ Configuration

### Backend Configuration

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=artist_management_system
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### Frontend Configuration

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 🏃‍♂️ Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:5000`

### Start Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

## 🔗 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | User login | Public |
| POST | `/auth/logout` | User logout | Private |
| GET | `/auth/profile` | Get user profile | Private |
| PUT | `/auth/profile` | Update profile | Private |
| PUT | `/auth/change-password` | Change password | Private |

### Example API Calls

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "role": "artist",
    "phone": "+1234567890"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

## 👥 User Roles

### Artist
- Manage profile and portfolio
- Create and manage service packages
- Handle booking requests
- View earnings and analytics

### Event Organizer
- Search and browse artists
- Send booking requests
- Manage events and bookings
- Leave reviews and feedback

### Administrator
- Manage all users and content
- View system analytics
- Moderate platform content
- Handle disputes and support

## 🗄️ Database Schema

### Core Tables

- **users** - User authentication and basic info
- **artists** - Artist-specific profile data
- **organizers** - Event organizer information
- **packages** - Artist service packages
- **bookings** - Booking transactions
- **feedback** - Reviews and ratings
- **messages** - User communications

### ER Diagram

```
users ──────┐
            ├─── artists ──── packages
            │                    │
            └─── organizers       │
                    │             │
                    └──── bookings ┘
                            │
                         feedback
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

### Manual Testing

Use the demo credentials provided in the login page:

- **Admin**: admin@artistmgmt.com / admin123
- **Artist**: john.artist@email.com / artist123
- **Organizer**: jane.organizer@email.com / organizer123

## 🚀 Deployment

### Production Build

#### Frontend
```bash
cd frontend
npm run build
```

#### Backend
```bash
cd backend
npm start
```

### Environment Variables for Production

Update your `.env` files with production values:

```env
NODE_ENV=production
JWT_SECRET=your_production_jwt_secret_here
FRONTEND_URL=https://your-domain.com
```

### Deployment Options

- **Frontend**: Netlify, Vercel, AWS S3
- **Backend**: Heroku, AWS EC2, DigitalOcean
- **Database**: AWS RDS, Google Cloud SQL, DigitalOcean Managed Databases

## 📁 Project Structure

```
artist-management-system/
├── backend/                 # Node.js backend
│   ├── config/             # Database & JWT config
│   ├── controllers/        # Request handlers
│   ├── middlewares/        # Auth & validation
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── utils/             # Helper functions
│   ├── package.json
│   └── server.js          # Entry point
├── frontend/               # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── context/       # React context
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Helper functions
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   └── package.json
├── database/              # Database files
│   └── schema.sql         # Database schema
├── docs/                  # Documentation
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

#### Database Connection Error
```
Error: ER_ACCESS_DENIED_ERROR: Access denied for user 'root'@'localhost'
```
**Solution**: Check your MySQL credentials in `.env` file

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill the process using the port or change the PORT in `.env`

#### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Ensure FRONTEND_URL is correctly set in backend `.env`

### Getting Help

- 📧 Email: support@artistmgmt.com
- 💬 Discord: [Join our community](https://discord.gg/artistmgmt)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/artist-management-system/issues)

## 📊 Roadmap

- [ ] Payment integration (Stripe/PayPal)
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Video portfolio uploads
- [ ] Multi-language support
- [ ] AI-powered artist recommendations

---

**Made with ❤️ by the Artist Management Team** 