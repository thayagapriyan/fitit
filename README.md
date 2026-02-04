# FixIt Web Application

**A Modern Home Repair & Maintenance Platform**

Connect with professional service providers and shop for quality home repair tools

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![AWS](https://img.shields.io/badge/AWS-CDK-FF9900?logo=amazonaws)](https://aws.amazon.com/cdk/)
[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?logo=turborepo)](https://turbo.build/)

</div>

---

## Overview

FixIt is a full-stack web application that serves as a one-stop platform for home repair and maintenance needs. Users can browse and purchase home repair tools, connect with professional service providers, and get AI-powered DIY guidance.

### Key Features

- **Tool Marketplace** - Browse and shop for power tools, hand tools, electrical supplies, plumbing equipment, and safety gear
- **Service Professionals** - Connect with verified electricians, carpenters, plumbers, HVAC technicians, and general handymen
- **Service Requests** - Post repair jobs and track their status from open to completion
- **AI Assistant** - Get DIY repair guidance, tool recommendations, and safety advice powered by Google Gemini
- **Role-Based Dashboard** - Personalized experience for customers and professionals

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (React 19 + Vite)                  │
│                   ECS Fargate + Load Balancer                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────────────┐
│                    Backend (Hono.js + Lambda)                   │
│                      HTTP API Gateway                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                       AWS Services                              │
│   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐  │
│   │   DynamoDB    │    │    Secrets    │    │  CloudWatch   │  │
│   │   (4 Tables)  │    │    Manager    │    │     Logs      │  │
│   └───────────────┘    └───────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Frontend

| Technology      | Purpose             |
| --------------- | ------------------- |
| React 19        | UI Framework        |
| TypeScript      | Type Safety         |
| Vite            | Build Tool          |
| React Router v7 | Client-side Routing |
| Tailwind CSS    | Styling             |
| Lucide Icons    | Icon Library        |

### Backend

| Technology       | Purpose             |
| ---------------- | ------------------- |
| Hono.js          | Web Framework       |
| Node.js 20       | Runtime             |
| AWS Lambda       | Serverless Compute  |
| DynamoDB         | NoSQL Database      |
| Zod              | Schema Validation   |
| Google Gemini AI | AI Chat Integration |

### Infrastructure

| Technology      | Purpose                 |
| --------------- | ----------------------- |
| AWS CDK         | Infrastructure as Code  |
| ECS Fargate     | Container Orchestration |
| API Gateway     | API Management          |
| Secrets Manager | Secrets Storage         |
| CloudWatch      | Logging & Monitoring    |

### Monorepo

| Technology     | Purpose            |
| -------------- | ------------------ |
| Turborepo      | Build System       |
| npm Workspaces | Package Management |

---

## Project Structure

```
fixit/
├── apps/
│   ├── backend/                 # Hono.js API server
│   │   ├── src/
│   │   │   ├── routes/          # API route handlers
│   │   │   ├── repositories/    # Database layer
│   │   │   ├── services/        # Business logic
│   │   │   ├── utils/           # Utilities & error handling
│   │   │   ├── config/          # Configuration
│   │   │   ├── index.ts         # Local server entry
│   │   │   └── lambda.ts        # AWS Lambda handler
│   │   └── package.json
│   │
│   └── frontend/                # React SPA
│       ├── src/
│       │   ├── pages/           # Page components
│       │   ├── components/      # Reusable UI components
│       │   ├── hooks/           # Custom React hooks
│       │   ├── services/        # API client layer
│       │   ├── context/         # React context providers
│       │   ├── router/          # Routing configuration
│       │   └── App.tsx          # Root component
│       └── package.json
│
├── packages/
│   └── shared-types/            # Shared TypeScript definitions
│       └── src/
│           └── index.ts         # Type exports
│
├── infrastructure/              # AWS CDK stacks
│   ├── bin/
│   │   └── app.ts               # CDK app entry point
│   ├── lib/
│   │   └── stacks/
│   │       ├── network-stack.ts
│   │       ├── database-stack.ts
│   │       ├── backend-stack.ts
│   │       └── frontend-stack.ts
│   └── package.json
│
├── scripts/                     # Deployment scripts
├── docs/                        # Documentation
├── turbo.json                   # Turborepo config
└── package.json                 # Root package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 10.x
- **AWS CLI** (configured with credentials for deployment)
- **Docker** (for frontend containerization)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/fixit.git
   cd fixit
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create `.env.local` in the root directory:

   ```env
   GEMINI_API_KEY=your_gemini_api_key
   ```

   For backend development, create `apps/backend/.env`:

   ```env
   NODE_ENV=development
   PORT=3001
   AWS_REGION=us-east-2
   GEMINI_API_KEY=your_gemini_api_key
   ```

### Running Locally

**Start all applications:**

```bash
npm run dev
```

This will start:

- Frontend at `http://localhost:5173`
- Backend at `http://localhost:3001`

**Run individual apps:**

```bash
# Frontend only
npm run dev --workspace=frontend

# Backend only
npm run dev --workspace=backend
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=frontend
npm run build --workspace=backend
```

---

## API Reference

### Products

| Method | Endpoint                           | Description            |
| ------ | ---------------------------------- | ---------------------- |
| GET    | `/api/products`                    | List all products      |
| GET    | `/api/products/:id`                | Get product by ID      |
| GET    | `/api/products/category/:category` | Filter by category     |
| GET    | `/api/products/search?q=query`     | Search products        |
| GET    | `/api/products/top-rated`          | Get top-rated products |
| POST   | `/api/products`                    | Create product         |
| PUT    | `/api/products/:id`                | Update product         |
| DELETE | `/api/products/:id`                | Delete product         |

**Categories:** `Power Tools`, `Hand Tools`, `Electrical`, `Plumbing`, `Safety`

### Service Profiles

| Method | Endpoint                                 | Description            |
| ------ | ---------------------------------------- | ---------------------- |
| GET    | `/api/service-profiles`                  | List all professionals |
| GET    | `/api/service-profiles/:id`              | Get profile by ID      |
| GET    | `/api/service-profiles/profession/:type` | Filter by profession   |
| POST   | `/api/service-profiles`                  | Create profile         |
| PUT    | `/api/service-profiles/:id`              | Update profile         |
| DELETE | `/api/service-profiles/:id`              | Delete profile         |

**Professions:** `Electrician`, `Carpenter`, `Plumber`, `HVAC`, `General Handyman`

### Service Requests

| Method | Endpoint                                     | Description       |
| ------ | -------------------------------------------- | ----------------- |
| GET    | `/api/service-requests`                      | List all requests |
| GET    | `/api/service-requests/:id`                  | Get request by ID |
| GET    | `/api/service-requests/customer/:customerId` | Get by customer   |
| GET    | `/api/service-requests/status/:status`       | Filter by status  |
| POST   | `/api/service-requests`                      | Create request    |
| PUT    | `/api/service-requests/:id`                  | Update request    |
| PUT    | `/api/service-requests/:id/accept`           | Accept a job      |
| DELETE | `/api/service-requests/:id`                  | Delete request    |

**Statuses:** `OPEN`, `IN_PROGRESS`, `COMPLETED`

### AI Assistant

| Method | Endpoint                     | Description                  |
| ------ | ---------------------------- | ---------------------------- |
| POST   | `/api/ai`                    | Send message to AI assistant |
| GET    | `/api/ai/history/:sessionId` | Get chat history             |
| DELETE | `/api/ai/history/:sessionId` | Clear chat history           |

---

## AWS Deployment

### Infrastructure Stacks

The infrastructure is organized into four CDK stacks:

1. **NetworkStack** - VPC, subnets, and security groups
2. **DatabaseStack** - DynamoDB tables with GSIs
3. **BackendStack** - Lambda function and API Gateway
4. **FrontendStack** - ECS Fargate cluster with ALB

### Deploying to AWS

1. **Bootstrap CDK (first time only)**

   ```bash
   cd infrastructure
   npx cdk bootstrap
   ```

2. **Deploy all stacks**

   ```bash
   npm run cdk:deploy
   ```

3. **Deploy individual stacks**
   ```bash
   npm run cdk:deploy:network
   npm run cdk:deploy:database
   npm run cdk:deploy:backend
   npm run cdk:deploy:frontend
   ```

### Database Setup

After deploying the database stack:

```bash
# Create tables
npm run create-tables

# Seed initial data
npm run seed-data
```

### DynamoDB Tables

| Table                    | Partition Key | Sort Key    | GSIs                               |
| ------------------------ | ------------- | ----------- | ---------------------------------- |
| `fixit-products`         | `id`          | -           | `category-index`                   |
| `fixit-service-profiles` | `id`          | -           | `profession-index`                 |
| `fixit-service-requests` | `id`          | -           | `customerId-index`, `status-index` |
| `fixit-chat`             | `sessionId`   | `timestamp` | -                                  |

---

## Environment Variables

### Backend

| Variable                 | Description                          | Required |
| ------------------------ | ------------------------------------ | -------- |
| `NODE_ENV`               | Environment (development/production) | Yes      |
| `PORT`                   | Server port (local development)      | No       |
| `AWS_REGION`             | AWS region                           | Yes      |
| `GEMINI_API_KEY`         | Google Gemini API key                | Yes      |
| `PRODUCTS_TABLE`         | DynamoDB products table name         | Yes      |
| `SERVICE_PROFILES_TABLE` | DynamoDB profiles table name         | Yes      |
| `SERVICE_REQUESTS_TABLE` | DynamoDB requests table name         | Yes      |
| `CHAT_TABLE`             | DynamoDB chat table name             | Yes      |

### Frontend

| Variable       | Description     | Required |
| -------------- | --------------- | -------- |
| `VITE_API_URL` | Backend API URL | Yes      |

---

## Scripts

| Command                 | Description                         |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Start all apps in development mode  |
| `npm run build`         | Build all packages                  |
| `npm run lint`          | Lint all packages                   |
| `npm run cdk:synth`     | Synthesize CloudFormation templates |
| `npm run cdk:deploy`    | Deploy all stacks to AWS            |
| `npm run create-tables` | Create DynamoDB tables              |
| `npm run seed-data`     | Seed initial data                   |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with modern web technologies and deployed on AWS
</div>
