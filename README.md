# Library Management System

## Initial Project Structure
library-management-system/
├── README.md
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   ├── server.js
│   └── src/
│       ├── config/
│       │   └── db.js
│       ├── models/
│       │   ├── Book.js
│       │   ├── Member.js
│       │   ├── Transaction.js
│       │   └── User.js
│       ├── controllers/
│       │   ├── bookController.js
│       │   ├── memberController.js
│       │   ├── transactionController.js
│       │   └── authController.js
│       ├── routes/
│       │   ├── bookRoutes.js
│       │   ├── memberRoutes.js
│       │   ├── transactionRoutes.js
│       │   └── authRoutes.js
│       └── middleware/
│           ├── authMiddleware.js
│           └── errorHandler.js
│
└── frontend/
    ├── package.json
    ├── .env
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── axios.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── BookCard.jsx
        │   └── BookForm.jsx
        └── pages/
            ├── Dashboard.jsx
            ├── Books.jsx
            ├── Members.jsx
            ├── IssueReturn.jsx
            └── Login.jsx