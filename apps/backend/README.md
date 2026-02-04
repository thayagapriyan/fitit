# Fixit Backend

Enterprise-level backend API for the Fixit home repair services platform, built with Hono.js and AWS DynamoDB.

## Features

- **RESTful API** with full CRUD operations
- **AWS DynamoDB** for scalable NoSQL data storage
- **Google Gemini AI** integration for chat assistance
- **TypeScript** with strict type checking
- **Enterprise patterns**: Repository pattern, centralized error handling, structured logging

## Quick Start

### Prerequisites

- Node.js 18+
- AWS account with DynamoDB access
- (Optional) Google Gemini API key for AI features

### Installation

```bash
cd backend
npm install
```

### Configuration

1. Copy the environment example:

   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your credentials:
   ```env
   AWS_REGION=us-east-2
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   GEMINI_API_KEY=your_gemini_key  # Optional
   ```

### Create DynamoDB Tables

```bash
npm run create-tables
```

### Start Development Server

```bash
npm run dev
```

Server runs at: http://localhost:3000

## API Endpoints

### Health Check

- `GET /health` - Server status

### Products

- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:category` - Filter by category
- `GET /api/products/search?q=term` - Search products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Service Profiles

- `GET /api/service-profiles` - List all professionals
- `GET /api/service-profiles/:id` - Get by ID
- `GET /api/service-profiles/profession/:profession` - Filter by profession
- `GET /api/service-profiles/available` - Get available only
- `POST /api/service-profiles` - Create profile
- `PATCH /api/service-profiles/:id/availability` - Toggle availability

### Service Requests

- `GET /api/service-requests` - List all requests
- `GET /api/service-requests/:id` - Get by ID
- `GET /api/service-requests/customer/:customerId` - By customer
- `GET /api/service-requests/status/:status` - By status
- `POST /api/service-requests` - Create request
- `PATCH /api/service-requests/:id/status` - Update status
- `POST /api/service-requests/:id/accept` - Accept job
- `POST /api/service-requests/:id/complete` - Complete job

### AI Chat

- `POST /api/ai` - Send chat message (matches frontend)
- `GET /api/ai/history/:sessionId` - Get chat history
- `DELETE /api/ai/history/:sessionId` - Clear history

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration (env, DynamoDB client)
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Logger, errors, response helpers
│   ├── repositories/   # Data access layer
│   ├── routes/         # API route handlers
│   └── index.ts        # Server entry point
├── scripts/
│   └── create-tables.ts  # DynamoDB setup
└── package.json
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run create-tables` - Create DynamoDB tables
