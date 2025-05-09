# Fantasy F1 Backend

Backend service for the Fantasy F1 game platform.

## Features

- User authentication and authorization
- League management
- Race calendar and results
- Driver and team selection system
- Automated scoring
- Admin tools
- Switcheroo feature

## Tech Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Puppeteer for race result scraping
- Node-cron for scheduled tasks
- Nodemailer for email notifications

## Project Structure

```
/fantasy-f1-backend
│
├── /src
│   ├── /config           # Configuration files
│   ├── /controllers      # Route handlers
│   ├── /middleware       # Middleware functions
│   ├── /models           # Mongoose schemas
│   ├── /routes           # Express routes
│   ├── /services         # Business logic
│   ├── /utils            # Helper functions
│   ├── /jobs             # Scheduled tasks
│   └── app.js            # Express app
│
├── /tests                # Test files
├── .env                  # Environment variables
├── package.json
└── README.md
```

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start MongoDB locally or update MONGODB_URI in `.env`
5. Run the development server:
   ```bash
   npm run dev
   ```

## API Documentation

The API documentation will be available at `/api-docs` when the server is running.

## Testing

Run tests with:
```bash
npm test
```

## License

MIT 