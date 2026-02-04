# AWS Credentials Security Guide

This document explains how to securely configure AWS credentials for the Fixit backend.

## ⚠️ Security Best Practices

> **NEVER commit AWS credentials to git!**

---

## Option 1: Environment Variables (Recommended for Development)

Create a `.env` file in `apps/backend/`:

```bash
# apps/backend/.env
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# DynamoDB Tables
DYNAMODB_PRODUCTS_TABLE=fixit-products
DYNAMODB_SERVICE_PROFILES_TABLE=fixit-service-profiles
DYNAMODB_SERVICE_REQUESTS_TABLE=fixit-service-requests
DYNAMODB_CHAT_TABLE=fixit-chat

# Gemini AI (optional)
GEMINI_API_KEY=your_gemini_key
```

> ✅ The `.env` file is already in `.gitignore`

---

## Option 2: AWS CLI Profile (Best for Development)

```bash
# Install AWS CLI
winget install Amazon.AWSCLI

# Configure with credentials
aws configure --profile fixit
```

Then set the profile in `.env`:

```bash
AWS_PROFILE=fixit
AWS_REGION=us-east-2
```

This is more secure because credentials are stored in `~/.aws/credentials` instead of project files.

---

## Option 3: IAM Role (Best for Production/AWS)

When deployed on AWS (Lambda, ECS, EC2), use **IAM Roles** instead of access keys:

1. Create an IAM Role with DynamoDB permissions
2. Attach the role to your compute resource
3. **No AWS_ACCESS_KEY_ID needed** - AWS SDK auto-detects role credentials

---

## Creating IAM User for Development

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Create a new IAM User with **programmatic access**
3. Attach this minimal policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:CreateTable",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:us-east-2:*:table/fixit-*"
    }
  ]
}
```

4. Save the Access Key ID and Secret (you only see these once!)

---

## Quick Setup Commands

```bash
# 1. Copy the example env file
cp apps/backend/.env.example apps/backend/.env

# 2. Edit with your credentials
# (Windows)
notepad apps/backend/.env

# 3. Create tables
npm run create-tables

# 4. Insert sample data
npm run seed-data

# 5. Start the app
npm run dev
```

---

## Verify Connection

```bash
# Test if credentials work
npm run create-tables

# Should show:
# ✅ Table fixit-products already exists
# ✅ Table fixit-service-profiles already exists
# ...
```

---

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] Never commit access keys to git
- [ ] Use IAM roles in production
- [ ] Use minimal IAM permissions
- [ ] Rotate access keys periodically
