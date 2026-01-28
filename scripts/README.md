# FitIt Scripts

This directory contains deployment and build scripts for the FitIt application.

## Quick Start

```powershell
# Deploy frontend to ECS (full pipeline)
.\deploy-frontend.ps1
```

---

## Scripts Overview

| Script                        | Purpose                                                                  |
| ----------------------------- | ------------------------------------------------------------------------ |
| `deploy-frontend.ps1`         | **Main deployment script** - builds, pushes, and deploys frontend to ECS |
| `build-and-push-frontend.ps1` | Build and push Docker image only (no ECS update)                         |
| `build-and-push-frontend.cmd` | CMD version of build-and-push                                            |

---

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Docker Desktop** running
3. **Node.js 20+** installed
4. **Environment file**: `.env.production` or `.env.local` in project root

### Required Environment Variables

Create `.env.production` in the project root:

```env
VITE_API_BASE_URL=https://your-api-gateway-url.amazonaws.com
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Deployment Commands

### Full Deployment (Recommended)

```powershell
cd scripts
.\deploy-frontend.ps1
```

This will:

1. Load environment variables
2. Build frontend locally (native Windows build)
3. Create `linux/amd64` Docker image
4. Push to ECR
5. Update ECS service

### Manual Steps (If Needed)

```powershell
# 1. Build frontend
cd apps/frontend
npm run build

# 2. Build Docker image for correct platform
docker buildx build --platform linux/amd64 -f Dockerfile.prod -t fitit-frontend:latest --load .

# 3. Push to ECR
aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com
docker tag fitit-frontend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/fitit-frontend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-2.amazonaws.com/fitit-frontend:latest

# 4. Force ECS redeployment
aws ecs update-service --cluster fitit-frontend-cluster --service fitit-frontend-service --force-new-deployment
```

---

## Troubleshooting

### Issue: `image Manifest does not contain descriptor matching platform 'linux/amd64'`

**Cause**: Docker built the image for ARM64 instead of AMD64.

**Fix**: Always use `--platform linux/amd64` with `docker buildx build`:

```powershell
docker buildx build --platform linux/amd64 -f Dockerfile.prod -t myimage:latest --load .
```

---

### Issue: esbuild crashes during Docker build (EPIPE, lfstack.push errors)

**Cause**: QEMU emulation doesn't work well with esbuild's native binaries.

**Fix**: Build the frontend **locally** first:

```powershell
cd apps/frontend
npm run build
```

Then use `Dockerfile.prod` which just copies the pre-built `dist/` folder.

---

### Issue: `ecr:GetAuthorizationToken` permission denied

**Cause**: ECS task execution role lacks ECR permissions.

**Fix**: Add these permissions to the execution role:

```json
{
  "Effect": "Allow",
  "Action": "ecr:GetAuthorizationToken",
  "Resource": "*"
},
{
  "Effect": "Allow",
  "Action": [
    "ecr:BatchCheckLayerAvailability",
    "ecr:GetDownloadUrlForLayer",
    "ecr:BatchGetImage"
  ],
  "Resource": "arn:aws:ecr:REGION:ACCOUNT:repository/fitit-frontend"
}
```

---

### Issue: `ECS was unable to assume the role`

**Cause**: Task role trust policy doesn't allow ECS to assume it.

**Fix**: Ensure the role's trust policy includes:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ecs-tasks.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

---

### Issue: CDK deploy causes `UPDATE_ROLLBACK_COMPLETE` on dependent stacks

**Cause**: CDK tries to update all stacks in dependency chain.

**Fix**: Use `--exclusively` flag:

```powershell
npx cdk deploy FititFrontendStack --exclusively
```

---

## Monitoring Deployment

```powershell
# Check deployment status
aws ecs describe-services --cluster fitit-frontend-cluster --services fitit-frontend-service --query "services[0].deployments"

# View task logs
aws logs tail /ecs/fitit-frontend --since 10m --format short

# Check stopped tasks for errors
aws ecs list-tasks --cluster fitit-frontend-cluster --desired-status STOPPED
aws ecs describe-tasks --cluster fitit-frontend-cluster --tasks TASK_ARN --query "tasks[0].stoppedReason"
```

---

## Architecture Notes

### Why Build Locally Instead of In Docker?

Docker Desktop on Windows/ARM can use QEMU to emulate x86_64, but this emulation:

- Causes esbuild (used by Vite) to crash
- Is slow and unreliable for Node.js builds

**Solution**: Build frontend natively on Windows, then create a minimal Docker image that just copies the built files into nginx.

### Docker Files

| File                            | Purpose                                                |
| ------------------------------- | ------------------------------------------------------ |
| `apps/frontend/Dockerfile`      | Full multi-stage build (use in CI/CD on Linux)         |
| `apps/frontend/Dockerfile.prod` | Minimal image for local builds (copies pre-built dist) |
