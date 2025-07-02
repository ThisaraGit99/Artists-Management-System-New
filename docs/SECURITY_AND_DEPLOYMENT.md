# Security & Deployment Guide

## Security Implementation

### 1. Authentication Security
```javascript
// JWT Implementation
const jwt = require('jsonwebtoken');

// Token Generation
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Token Verification Middleware
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
  }
};
```

### 2. Password Security
```javascript
// Password Hashing
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

### 3. Role-Based Access Control
```javascript
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Usage
router.get('/admin/users', 
  verifyToken, 
  checkRole(['admin']), 
  adminController.getUsers
);
```

### 4. Input Validation
```javascript
const { body, validationResult } = require('express-validator');

const validateEvent = [
  body('title').trim().notEmpty(),
  body('event_date').isDate(),
  body('budget').isNumeric(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 5. File Upload Security
```javascript
const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
```

## Deployment Guide

### 1. Environment Configuration
```bash
# .env.production
NODE_ENV=production
PORT=3000
DB_HOST=production-db-host
DB_USER=db-user
DB_PASSWORD=db-password
DB_NAME=artist_management
JWT_SECRET=your-secret-key
STRIPE_KEY=your-stripe-key
```

### 2. Database Setup
```sql
-- Production Database Setup
CREATE DATABASE artist_management;
USE artist_management;

-- Run all table creation scripts
-- Set up indexes
-- Create necessary users and permissions

GRANT SELECT, INSERT, UPDATE, DELETE ON artist_management.* TO 'app_user'@'%';
```

### 3. Server Configuration (nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /path/to/uploads;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}
```

### 4. PM2 Process Management
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'artist-management',
    script: 'backend/server.js',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

### 5. Backup Strategy
```bash
#!/bin/bash
# backup.sh

# Database backup
mysqldump -u backup_user -p artist_management > backup_$(date +%Y%m%d).sql

# Files backup
tar -czf uploads_$(date +%Y%m%d).tar.gz uploads/

# Upload to secure storage
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-bucket/backups/
aws s3 cp uploads_$(date +%Y%m%d).tar.gz s3://your-bucket/backups/
```

### 6. Monitoring Setup
```javascript
// Monitoring configuration
const winston = require('winston');
const Sentry = require('@sentry/node');

// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Sentry setup
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### 7. Deployment Checklist

#### Pre-Deployment
- [ ] Run all tests
- [ ] Update environment variables
- [ ] Backup database
- [ ] Check disk space
- [ ] Update documentation

#### Deployment Steps
1. Stop current application
2. Pull latest code
3. Install dependencies
4. Run database migrations
5. Build frontend
6. Start application
7. Run smoke tests

#### Post-Deployment
- [ ] Monitor error logs
- [ ] Check application metrics
- [ ] Verify all features
- [ ] Test backup systems

### 8. Scaling Considerations

#### Horizontal Scaling
- Use load balancer
- Configure session sharing
- Set up read replicas for database
- Implement caching strategy

#### Vertical Scaling
- Optimize database queries
- Implement request caching
- Use CDN for static assets
- Configure resource limits

### 9. Security Checklist

#### Application Security
- [ ] Enable HTTPS
- [ ] Set secure headers
- [ ] Configure CORS
- [ ] Rate limiting
- [ ] Input validation
- [ ] XSS protection
- [ ] CSRF protection

#### Server Security
- [ ] Firewall configuration
- [ ] Regular updates
- [ ] SSH key authentication
- [ ] Disable root login
- [ ] Monitor system logs 