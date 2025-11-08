# Swapper

Swapper is a full-stack web application that enables users to manage events and swap time slots with other users. Built with modern technologies, it provides a seamless experience for scheduling and rescheduling through a user-friendly interface.

## Project Overview

Swapper allows users to create events, mark them as swappable, browse available time slots from other users, and send swap requests. The application features real-time updates using Socket.IO, ensuring users receive instant notifications about swap requests and status changes.

### Core Features

1. **User Authentication & Authorization**
   - Secure user registration and login with JWT tokens
   - Password encryption using bcrypt
   - Role-based access control

2. **Event Management**
   - Create, read, update, and delete personal events
   - Mark events as swappable to make them available for swapping
   - View all personal events in a calendar-like interface

3. **Marketplace for Time Slots**
   - Browse available swappable slots from other users
   - View detailed information about each swappable slot
   - Search and filter functionality

4. **Swap Request System**
   - Send swap requests for desired time slots
   - Accept or reject incoming swap requests
   - Cancel outgoing swap requests
   - Track request history and status

5. **Real-time Communication**
   - Instant notifications for swap requests and status changes
   - Live updates without page refresh

### Key Design Choices

- **Microservice Architecture**: Separated frontend and backend for better scalability
- **TypeScript**: Used throughout both frontend and backend for type safety
- **MongoDB**: Chosen for its flexibility with event-based data
- **JWT Authentication**: Stateless authentication for better scalability
- **RESTful API**: Consistent and predictable API design
- **Responsive UI**: Works seamlessly across devices

## Local Setup Instructions

### Prerequisites

- Node.js v20 or higher
- npm v9 or higher
- MongoDB v4.4 or higher (for local setup)
- Docker and Docker Compose (optional, for containerized setup)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Swapper
   ```

2. **Install backend dependencies:**
   ```bash
   cd Backend
   npm install
   cd ..
   ```

3. **Install frontend dependencies:**
   ```bash
   cd Frontend
   npm install
   cd ..
   ```

### Environment Configuration

#### Backend Environment Variables
Create a `.env` file in the `Backend` directory with the following variables:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/slotswapper

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

#### Frontend Environment Variables
Create a `.env` file in the `Frontend` directory with the following variables:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

### Database Setup

1. **Local MongoDB Setup:**
   - Install MongoDB locally or use MongoDB Atlas
   - Ensure MongoDB is running on the default port (27017)
   - Update the `MONGODB_URI` in the backend `.env` file if needed

2. **Docker MongoDB Setup:**
   - MongoDB will be automatically set up when using Docker Compose

### Running Services Individually

#### Backend
```bash
cd Backend
npm run dev
```
The backend will start on `http://localhost:3000`

#### Frontend
```bash
cd Frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

### Seeding the Database with Test Data

The project includes a script to populate the database with test data for development and testing purposes. The seed script creates:

- 5 test users with predefined credentials
- Random events for each user with various statuses (BUSY, SWAPPABLE, SWAPPED)
- Random swap requests between users with different statuses (PENDING, ACCEPTED, REJECTED)

```bash
npm run seed
```

#### Test Users Created by the Seed Script

| Name           | Email             | Password  |
|----------------|-------------------|-----------|
| John Doe       | john@test.com     | Test123!  |
| Jane Smith     | jane@test.com     | Test123!  |
| Mike Johnson   | mike@test.com     | Test123!  |
| Sarah Williams | sarah@test.com    | Test123!  |
| David Brown    | david@test.com    | Test123!  |

#### Running the Seed Script

To populate the database with test data:

```bash
cd Backend
npm run seed
```

To clear all data from the database:

```bash
cd Backend
npm run seed:clear
```

## API Documentation

The Swapper API provides endpoints for user authentication, event management, marketplace browsing, and swap requests.

### Authentication Endpoints

| Method | Endpoint         | Description           |
|--------|------------------|-----------------------|
| POST   | `/api/auth/register` | Register a new user   |
| POST   | `/api/auth/login`    | Login existing user   |
| GET    | `/api/auth/me`       | Get current user info |

### Events Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| POST   | `/api/events`         | Create a new event             |
| GET    | `/api/events`         | Get all user events            |
| GET    | `/api/events/:id`     | Get a specific event           |
| PUT    | `/api/events/:id`     | Update an event                |
| DELETE | `/api/events/:id`     | Delete an event                |
| PATCH  | `/api/events/:id/mark-swappable` | Mark event as swappable |

### Marketplace Endpoints

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/api/marketplace`    | Get all swappable slots        |
| GET    | `/api/marketplace/:id`| Get details of a swappable slot|

### Swap Requests Endpoints

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| GET    | `/api/swap-requests/incoming`   | Get incoming swap requests   |
| GET    | `/api/swap-requests/outgoing`   | Get outgoing swap requests   |
| POST   | `/api/swap-requests`            | Create a new swap request    |
| PATCH  | `/api/swap-requests/:id/accept` | Accept a swap request        |
| PATCH  | `/api/swap-requests/:id/reject` | Reject a swap request        |
| DELETE | `/api/swap-requests/:id`        | Cancel a swap request        |

### Using the Postman Collection

For detailed API documentation with example requests and responses, you can use the [Postman collection](./Backend/postman/SlotSwapper.postman_collection.json) included in the project. This collection provides pre-configured requests for all API endpoints, making it easy to test the application's functionality.

To use the Postman collection:
1. Open Postman
2. Import the collection file: `Backend/postman/SlotSwapper.postman_collection.json`
3. Update the environment variables (`base_url` and `token`) as needed
4. Start testing the API endpoints

## Development Notes

### Assumptions Made During Development

1. Users have basic familiarity with web applications and scheduling concepts
2. Real-time updates are critical for a good user experience
3. Security is paramount, especially with user authentication and data protection
4. The application should be responsive and work well on both desktop and mobile devices

### Challenges Faced and Resolutions

1. **Docker Architecture Compatibility**
   - Challenge: Encountered "exec format error" when building Docker images on Apple Silicon Macs
   - Resolution: Updated Dockerfiles to use Node.js 20 and removed platform-specific flags that caused compatibility issues

2. **MongoDB Version Compatibility**
   - Challenge: MongoDB latest versions require AVX instructions not available on older CPUs
   - Resolution: Downgraded to MongoDB 4.4 in Docker Compose for better compatibility

3. **Node.js Version Requirements**
   - Challenge: Vite requires Node.js 20.19+ or 22.12+ which wasn't compatible with the previous setup
   - Resolution: Updated both frontend and backend Dockerfiles to use Node.js 20 consistently

4. **Cross-Service Communication in Docker**
   - Challenge: Services couldn't communicate properly within Docker containers
   - Resolution: Configured proper Docker networks and updated service URLs to use container names

5. **File Watching in Development Containers**
   - Challenge: File changes weren't being detected properly in development containers
   - Resolution: Added volume mount optimizations and legacy watch flags for better development experience

### Future Improvements

1. Add comprehensive unit and integration tests
2. Implement automated CI/CD pipelines
3. Add more advanced filtering and search capabilities in the marketplace
4. Implement email notifications for important events
5. Add calendar integration (Google Calendar, Outlook, etc.)
6. Enhance the UI with more interactive elements and animations