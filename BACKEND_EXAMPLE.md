# Quick Backend Setup for Testing

This is a minimal Node.js/Express backend to get authentication working.

## Setup

1. **Create a new folder for backend:**
```bash
cd C:\xampp\htdocs
mkdir contract-monitoring-backend
cd contract-monitoring-backend
```

2. **Initialize project:**
```bash
npm init -y
npm install express mysql2 jsonwebtoken bcryptjs cors dotenv body-parser
```

3. **Create `server.js`:**

```javascript
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();
const PORT = 8000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

// Database connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'contract_monitoring',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        contactNumber: user.contactNumber,
        address: user.address
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, email, firstName, lastName, role, contactNumber, address FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
});
```

4. **Create database and user:**

Open phpMyAdmin (http://localhost/phpmyadmin) and run:

```sql
CREATE DATABASE contract_monitoring;
USE contract_monitoring;

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  role ENUM('ADMIN', 'STAFF', 'TENANT') DEFAULT 'TENANT',
  contactNumber VARCHAR(50),
  address TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert admin user (password: admin123)
INSERT INTO users (id, email, password, firstName, lastName, role, contactNumber, address)
VALUES (
  UUID(),
  'admin@pfda-bulan.gov.ph',
  '$2a$10$rVX5VqEEfnYxvLqjEqYqnOZm5YqXx5YqYX5YqXx5YqXx5YqXx5Yq.',
  'PFDA',
  'Administrator',
  'ADMIN',
  '+63-9XX-XXX-XXXX',
  'PFDA Fish Port, Bulan, Sorsogon'
);
```

**Note:** You need to generate the bcrypt hash. Run this in Node.js:
```javascript
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('admin123', 10));
```

5. **Start the backend:**
```bash
node server.js
```

6. **Test login:**

Open the frontend at http://localhost:3000 and login with:
- Email: `admin@pfda-bulan.gov.ph`
- Password: `admin123`

## Next Steps

After login works, you need to implement:

- All other API endpoints (contracts, payments, etc.)
- Full database schema
- QR code generation
- Email notifications
- Report generation
- File uploads

See **API_SPECIFICATION.md** for complete API requirements.
