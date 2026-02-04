# ============================================

# Fixit Infrastructure Deployment Scripts

# ============================================

## Scripts

### deploy-frontend.ps1

Deploys the frontend application to AWS ECS/Fargate.

**Usage:**

```powershell
cd infrastructure
.\scripts\deploy-frontend.ps1
```

**What it does:**

1. Loads environment variables from `.env.production`
2. Builds the frontend with Vite
3. Creates a Docker image (linux/amd64)
4. Pushes to ECR
5. Updates ECS service

### deploy-database.ps1

Deploys only the database stack (DynamoDB tables).

**Usage:**

```powershell
cd infrastructure
.\scripts\deploy-database.ps1
```

---

## Prerequisites

1. **AWS CLI** configured with valid credentials
2. **Docker Desktop** running with buildx support
3. **Node.js** installed for frontend build
4. **Environment file**: Copy `.env.production` and fill in real values

---

## Full Infrastructure Deployment

To deploy all stacks:

```powershell
cd infrastructure
npx cdk deploy --all
```

To deploy specific stacks:

```powershell
npx cdk deploy FixitDatabaseStack     # DynamoDB tables only
npx cdk deploy FixitBackendStack      # Backend Lambda + API Gateway
npx cdk deploy FixitFrontendStack     # ECS/Fargate + ALB
```

---

## Tearing Down Infrastructure

### Destroy all stacks (current Fixit stacks)

From the **repository root**: `npm run cdk:destroy`. Or from `infrastructure`: `npx cdk destroy --all`. Stacks are removed in dependency order.

### Remove old "Fitit" stacks after renaming to Fixit

To delete only the legacy stacks: `npm run cdk:destroy:legacy` (runs `cdk destroy FititFrontendStack FititBackendStack FititDatabaseStack FititNetworkStack --force`).

### Deploying the name change (fitit → fixit)

- **Option A:** With old code run `npm run cdk:destroy`, then switch to new code and `npm run cdk:deploy`. New DynamoDB tables (`fixit-*`) will be empty; migrate or re-seed if needed.
- **Option B:** Deploy new Fixit stacks first with `npm run cdk:deploy`, then remove old stacks with `npm run cdk:destroy:legacy`.

---

## Security Notes

- **Never commit** `.env.production` or `.env.local` files
- All secrets should be in environment files (gitignored)
- Supabase anon keys are safe for frontend (Row Level Security)
- AWS credentials should use IAM roles in production
