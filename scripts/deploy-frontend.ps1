# ============================================
# FitIt Frontend - Production Deployment Script
# ============================================
# This script handles the complete deployment:
# 1. Builds frontend locally (avoids QEMU/esbuild issues)
# 2. Creates linux/amd64 Docker image
# 3. Pushes to ECR
# 4. Updates ECS service
# ============================================

param(
    [string]$ImageTag = "latest",
    [string]$Region = "us-east-2"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$FrontendDir = Join-Path $ProjectRoot "apps/frontend"

function Write-Step { param($step, $msg) Write-Host "[$step] $msg" -ForegroundColor Yellow }
function Write-Success { param($msg) Write-Host "  $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "  $msg" -ForegroundColor Gray }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  FitIt Frontend - Production Deploy" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# Step 1: Load Environment Variables
# ============================================
Write-Step "1/6" "Loading environment variables..."

$envFiles = @(
    (Join-Path $ProjectRoot ".env.production"),
    (Join-Path $ProjectRoot ".env.local")
)

$EnvFile = $null
foreach ($f in $envFiles) {
    if (Test-Path $f) { $EnvFile = $f; break }
}

if (-not $EnvFile) {
    throw "No .env.production or .env.local found. Create one with VITE_* variables."
}

Get-Content $EnvFile | ForEach-Object {
    if ($_ -match "^([^#][^=]*)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}
Write-Info "Loaded: $EnvFile"

# Verify required variables
$required = @("VITE_API_BASE_URL", "VITE_FIREBASE_API_KEY", "VITE_FIREBASE_PROJECT_ID")
foreach ($var in $required) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        throw "Missing required variable: $var"
    }
}

# ============================================
# Step 2: Get AWS Account Info
# ============================================
Write-Step "2/6" "Getting AWS account info..."

$AccountId = aws sts get-caller-identity --query Account --output text
if ($LASTEXITCODE -ne 0) { throw "Failed to get AWS Account ID. Check AWS credentials." }

$EcrUri = "$AccountId.dkr.ecr.$Region.amazonaws.com"
$RepoName = "fitit-frontend"
$FullImageUri = "$EcrUri/${RepoName}:$ImageTag"

Write-Info "Account: $AccountId, Region: $Region"

# ============================================
# Step 3: Build Frontend Locally
# ============================================
Write-Step "3/6" "Building frontend (native Windows build)..."

Push-Location $FrontendDir
try {
    # Set VITE env vars for the build
    $env:VITE_API_BASE_URL = [Environment]::GetEnvironmentVariable("VITE_API_BASE_URL", "Process")
    $env:VITE_FIREBASE_API_KEY = [Environment]::GetEnvironmentVariable("VITE_FIREBASE_API_KEY", "Process")
    $env:VITE_FIREBASE_AUTH_DOMAIN = [Environment]::GetEnvironmentVariable("VITE_FIREBASE_AUTH_DOMAIN", "Process")
    $env:VITE_FIREBASE_PROJECT_ID = [Environment]::GetEnvironmentVariable("VITE_FIREBASE_PROJECT_ID", "Process")
    $env:VITE_FIREBASE_STORAGE_BUCKET = [Environment]::GetEnvironmentVariable("VITE_FIREBASE_STORAGE_BUCKET", "Process")
    $env:VITE_FIREBASE_MESSAGING_SENDER_ID = [Environment]::GetEnvironmentVariable("VITE_FIREBASE_MESSAGING_SENDER_ID", "Process")
    $env:VITE_FIREBASE_APP_ID = [Environment]::GetEnvironmentVariable("VITE_FIREBASE_APP_ID", "Process")
    
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Frontend build failed" }
}
finally {
    Pop-Location
}
Write-Success "Build complete: apps/frontend/dist"

# ============================================
# Step 4: Build Docker Image (linux/amd64)
# ============================================
Write-Step "4/6" "Building Docker image (linux/amd64)..."

Push-Location $FrontendDir
try {
    # Use buildx with explicit platform to avoid ARM/x86 issues
    docker buildx build `
        --platform linux/amd64 `
        -f Dockerfile.prod `
        -t "${RepoName}:$ImageTag" `
        --load `
        .
    
    if ($LASTEXITCODE -ne 0) { throw "Docker build failed" }
}
finally {
    Pop-Location
}
Write-Success "Image built: ${RepoName}:$ImageTag"

# ============================================
# Step 5: Push to ECR
# ============================================
Write-Step "5/6" "Pushing to ECR..."

# Login to ECR
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $EcrUri
if ($LASTEXITCODE -ne 0) { throw "ECR login failed" }

# Tag and push
docker tag "${RepoName}:$ImageTag" $FullImageUri
docker push $FullImageUri
if ($LASTEXITCODE -ne 0) { throw "Docker push failed" }

Write-Success "Pushed: $FullImageUri"

# ============================================
# Step 6: Update ECS Service
# ============================================
Write-Step "6/6" "Updating ECS service..."

$ClusterName = "fitit-frontend-cluster"
$ServiceName = "fitit-frontend-service"

# Force new deployment to pull the updated image
aws ecs update-service `
    --cluster $ClusterName `
    --service $ServiceName `
    --force-new-deployment `
    --query "service.status" `
    --output text

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  DEPLOYMENT STARTED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host "`nMonitor deployment progress:" -ForegroundColor Cyan
    Write-Host "  aws ecs describe-services --cluster $ClusterName --services $ServiceName --query 'services[0].deployments'" -ForegroundColor Gray
    
    Write-Host "`nFrontend URL:" -ForegroundColor Cyan
    $url = aws cloudformation describe-stacks --stack-name FititFrontendStack --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerUrl'].OutputValue" --output text
    Write-Host "  http://$url" -ForegroundColor White
}
else {
    throw "ECS service update failed"
}
