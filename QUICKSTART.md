# 🚀 Quick Start Guide

Get the Artist Management System up and running in minutes!

## ⚡ Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v16+)
- [MySQL](https://dev.mysql.com/downloads/) (v8.0+)
- [Git](https://git-scm.com/)

## 📋 Step-by-Step Setup

### 1. Clone & Navigate
```bash
git clone https://github.com/your-username/artist-management-system.git
cd artist-management-system
```

### 2. Setup Database
```bash
# Start MySQL and create database
mysql -u root -p
CREATE DATABASE artist_management_system;
exit

# Import schema
mysql -u root -p artist_management_system < database/schema.sql
```

### 3. Configure Backend
```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp env.template .env

# Edit .env file - UPDATE THESE VALUES:
# DB_PASSWORD=your_mysql_password
# JWT_SECRET=your_secret_key_here
```

### 4. Configure Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file (optional)
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

## 🎉 You're Ready!

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database**: MySQL on localhost:3306

## 🔐 Demo Login Credentials

Test the system with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@artistmgmt.com | admin123 |
| Artist | john.artist@email.com | artist123 |
| Organizer | jane.organizer@email.com | organizer123 |

## 🛠️ Troubleshooting

### Database Connection Issues
```bash
# Check MySQL is running
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# Reset MySQL password if needed
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'newpassword';
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :5000  # Windows
```

### Node Module Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📚 Next Steps

1. **Explore Features**: Try creating artist profiles, bookings, and reviews
2. **Read Documentation**: Check the main [README.md](README.md) for detailed info
3. **Customize**: Modify the code to fit your specific needs
4. **Deploy**: Follow deployment guide for production setup

## 🆘 Need Help?

- 📖 **Full Documentation**: [README.md](README.md)
- 🐛 **Issues**: Create a GitHub issue
- 💬 **Community**: Join our Discord

---

**Happy coding! 🎵** 