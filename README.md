# Rental App Backend API

A complete Node.js/Express backend for a rental property application with JWT authentication, MongoDB database, and full CRUD operations for all features.

## 🚀 Features

- **Authentication**: JWT-based authentication with bcrypt password hashing, Google OAuth, Phone login
- **User Management**: Register, login, profile management, preferences, FCM tokens
- **Properties**: Full CRUD with approval workflow for owners and admins
- **Reviews**: Property reviews with helpful voting
- **Favorites**: Save and manage favorite properties
- **Viewings**: Schedule and manage property viewing appointments
- **Chat & Messaging**: Real-time messaging between users with soft delete
- **Notifications**: In-app notifications with read/unread tracking
- **Admin Panel**: User management, property approval, support chats

## 📁 Project Structure

```
rental_app_backend/
├── src/
│   ├── config/
│   │   ├── index.js              # Configuration settings
│   │   └── database.js           # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── propertyController.js # Property CRUD logic
│   │   ├── reviewController.js   # Review logic
│   │   ├── favoriteController.js # Favorites logic
│   │   ├── viewingController.js  # Viewing appointments
│   │   ├── chatController.js     # Chat & messages
│   │   ├── notificationController.js # Notifications
│   │   ├── userController.js     # Admin user management
│   │   └── index.js
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   ├── errorHandler.js       # Error handling
│   │   └── index.js
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Property.js           # Property model
│   │   ├── Review.js             # Review model
│   │   ├── Favorite.js           # Favorite model
│   │   ├── Viewing.js            # Viewing model
│   │   ├── Chat.js               # Chat room model
│   │   ├── Message.js            # Message model
│   │   ├── Notification.js       # Notification model
│   │   └── index.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── propertyRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── favoriteRoutes.js
│   │   ├── viewingRoutes.js
│   │   ├── chatRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── userRoutes.js
│   │   └── index.js
│   ├── validators/
│   │   ├── authValidator.js
│   │   ├── propertyValidator.js
│   │   ├── reviewValidator.js
│   │   ├── viewingValidator.js
│   │   └── index.js
│   ├── seeds/
│   │   └── seed.js               # Database seeder
│   ├── app.js                    # Express app configuration
│   └── server.js                 # Server entry point
├── .env                          # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## 🛠️ Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. Navigate to the backend directory:

```bash
cd rental_app_backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env`:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rental_app
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=10
```

4. Seed the database (optional):

```bash
npm run seed
```

5. Start the server:

```bash
npm run dev    # Development with nodemon
npm start      # Production
```

## 📚 API Endpoints

### Base URL

```
http://localhost:3000/api
```

### Health Check

| Method | Endpoint  | Description      |
| ------ | --------- | ---------------- |
| GET    | `/health` | Check API status |

---

### 🔐 Authentication (`/auth`)

| Method | Endpoint                | Description                | Auth |
| ------ | ----------------------- | -------------------------- | ---- |
| POST   | `/auth/register`        | Register new user          | No   |
| POST   | `/auth/login`           | Login with email/password  | No   |
| POST   | `/auth/login/phone`     | Login with phone number    | No   |
| POST   | `/auth/google`          | Google OAuth login         | No   |
| POST   | `/auth/set-password`    | Set password (OAuth users) | Yes  |
| GET    | `/auth/me`              | Get current user profile   | Yes  |
| PUT    | `/auth/profile`         | Update profile             | Yes  |
| PUT    | `/auth/preferences`     | Update theme/locale        | Yes  |
| PUT    | `/auth/change-password` | Change password            | Yes  |
| PUT    | `/auth/fcm-token`       | Update FCM token           | Yes  |
| POST   | `/auth/refresh-token`   | Refresh JWT token          | Yes  |
| POST   | `/auth/logout`          | Logout user                | Yes  |

---

### 🏠 Properties (`/properties`)

| Method | Endpoint                          | Description                | Auth | Role        |
| ------ | --------------------------------- | -------------------------- | ---- | ----------- |
| GET    | `/properties`                     | List approved properties   | No   | -           |
| GET    | `/properties/:id`                 | Get property by ID         | No   | -           |
| POST   | `/properties/:id/view`            | Increment view count       | No   | -           |
| GET    | `/properties/owner/my-properties` | Get owner's properties     | Yes  | owner/admin |
| POST   | `/properties`                     | Create property            | Yes  | owner/admin |
| PUT    | `/properties/:id`                 | Update property            | Yes  | owner/admin |
| DELETE | `/properties/:id`                 | Delete property            | Yes  | owner/admin |
| PUT    | `/properties/:id/resubmit`        | Resubmit rejected property | Yes  | owner       |
| PATCH  | `/properties/:id/availability`    | Toggle availability        | Yes  | owner/admin |
| GET    | `/properties/admin/pending`       | Get pending properties     | Yes  | admin       |
| GET    | `/properties/admin/rejected`      | Get rejected properties    | Yes  | admin       |
| PUT    | `/properties/:id/approve`         | Approve property           | Yes  | admin       |
| PUT    | `/properties/:id/reject`          | Reject property            | Yes  | admin       |

**Query Parameters for GET `/properties`:**

- `location` - Filter by location (case-insensitive)
- `propertyType` - apartment, house, condo, townhouse, studio, room, other
- `minPrice` / `maxPrice` - Price range
- `bedrooms` / `bathrooms` - Minimum count
- `amenities` - Comma-separated list
- `page` / `limit` - Pagination
- `sortBy` / `sortOrder` - Sorting

---

### ⭐ Reviews (`/reviews`)

| Method | Endpoint                        | Description          | Auth |
| ------ | ------------------------------- | -------------------- | ---- |
| GET    | `/reviews/property/:propertyId` | Get property reviews | No   |
| GET    | `/reviews/user/:userId`         | Get user's reviews   | No   |
| POST   | `/reviews`                      | Create review        | Yes  |
| PUT    | `/reviews/:id`                  | Update review        | Yes  |
| DELETE | `/reviews/:id`                  | Delete review        | Yes  |
| POST   | `/reviews/:id/helpful`          | Toggle helpful vote  | Yes  |

---

### ❤️ Favorites (`/favorites`)

| Method | Endpoint                        | Description               | Auth |
| ------ | ------------------------------- | ------------------------- | ---- |
| GET    | `/favorites`                    | Get user's favorites      | Yes  |
| GET    | `/favorites/ids`                | Get favorite property IDs | Yes  |
| GET    | `/favorites/check/:propertyId`  | Check if favorited        | Yes  |
| POST   | `/favorites`                    | Add to favorites          | Yes  |
| POST   | `/favorites/toggle/:propertyId` | Toggle favorite           | Yes  |
| DELETE | `/favorites/:propertyId`        | Remove from favorites     | Yes  |

---

### 📅 Viewings (`/viewings`)

| Method | Endpoint               | Description           | Auth | Role        |
| ------ | ---------------------- | --------------------- | ---- | ----------- |
| GET    | `/viewings/user`       | Get user's viewings   | Yes  | -           |
| GET    | `/viewings/owner`      | Get owner's viewings  | Yes  | owner/admin |
| POST   | `/viewings`            | Request a viewing     | Yes  | -           |
| PUT    | `/viewings/:id/status` | Update viewing status | Yes  | -           |
| DELETE | `/viewings/:id`        | Delete viewing        | Yes  | -           |

**Viewing Statuses:** pending, confirmed, cancelled, completed, rejected

---

### 💬 Chats (`/chats`)

| Method | Endpoint                             | Description                | Auth | Role  |
| ------ | ------------------------------------ | -------------------------- | ---- | ----- |
| GET    | `/chats`                             | Get user's chats           | Yes  | -     |
| GET    | `/chats/unread-count`                | Get total unread count     | Yes  | -     |
| GET    | `/chats/admin/support`               | Get all support chats      | Yes  | admin |
| POST   | `/chats`                             | Get or create chat         | Yes  | -     |
| POST   | `/chats/support`                     | Get or create support chat | Yes  | -     |
| GET    | `/chats/:chatId/messages`            | Get chat messages          | Yes  | -     |
| POST   | `/chats/:chatId/messages`            | Send message               | Yes  | -     |
| DELETE | `/chats/:chatId/messages/:messageId` | Delete message             | Yes  | -     |
| PUT    | `/chats/:chatId/read`                | Mark messages as read      | Yes  | -     |

---

### 🔔 Notifications (`/notifications`)

| Method | Endpoint                      | Description              | Auth | Role  |
| ------ | ----------------------------- | ------------------------ | ---- | ----- |
| GET    | `/notifications`              | Get user's notifications | Yes  | -     |
| GET    | `/notifications/unread-count` | Get unread count         | Yes  | -     |
| PUT    | `/notifications/read-all`     | Mark all as read         | Yes  | -     |
| PUT    | `/notifications/:id/read`     | Mark one as read         | Yes  | -     |
| DELETE | `/notifications`              | Delete all notifications | Yes  | -     |
| DELETE | `/notifications/:id`          | Delete notification      | Yes  | -     |
| POST   | `/notifications`              | Create notification      | Yes  | admin |

**Notification Types:** message, propertyUpdate, review, system, supportMessage, viewing, approval

---

### 👥 Users (`/users`) - Admin Only

| Method | Endpoint                   | Description         | Auth | Role  |
| ------ | -------------------------- | ------------------- | ---- | ----- |
| GET    | `/users/:id`               | Get user profile    | No   | -     |
| GET    | `/users`                   | List all users      | Yes  | admin |
| GET    | `/users/stats`             | Get user statistics | Yes  | admin |
| PUT    | `/users/:id`               | Update user         | Yes  | admin |
| DELETE | `/users/:id`               | Delete user         | Yes  | admin |
| PATCH  | `/users/:id/toggle-active` | Toggle user active  | Yes  | admin |

---

## 🔑 User Roles

| Role    | Description                                                            |
| ------- | ---------------------------------------------------------------------- |
| `user`  | Regular user - can browse, favorite, review, schedule viewings         |
| `owner` | Property owner - all user abilities + create/manage properties         |
| `admin` | Administrator - all owner abilities + approve properties, manage users |

---

## 📝 Request Examples

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "Password123",
    "role": "user"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

### Create Property

```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Beautiful Apartment",
    "description": "A lovely 2BR apartment in downtown",
    "price": 2500,
    "location": "123 Main St, New York, NY",
    "propertyType": "apartment",
    "bedrooms": 2,
    "bathrooms": 1,
    "amenities": ["WiFi", "AC", "Parking"]
  }'
```

---

## 🧪 Test Accounts

After running `npm run seed`:

| Role  | Email               | Password  |
| ----- | ------------------- | --------- |
| Admin | admin@rentalapp.com | Admin123  |
| Owner | john@rentalapp.com  | John1234  |
| Owner | jane@rentalapp.com  | Jane1234  |
| User  | mike@rentalapp.com  | Mike1234  |
| User  | sarah@rentalapp.com | Sarah1234 |

---

## 🔒 Security Features

- JWT tokens with configurable expiration
- Password hashing with bcrypt
- Request validation on all endpoints
- Role-based access control (RBAC)
- Soft delete for messages (per-user deletion)
- Property approval workflow

---

## 📄 License

MIT License
