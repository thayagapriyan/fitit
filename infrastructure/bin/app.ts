#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/stacks/network-stack';
import { DatabaseStack } from '../lib/stacks/database-stack';
import { BackendStack } from '../lib/stacks/backend-stack';
import { FrontendStack } from '../lib/stacks/frontend-stack';

/**
 * Fixit Infrastructure CDK App
 *
 * Deploys:
 * - NetworkStack: VPC, subnets, security groups
 * - DatabaseStack: DynamoDB tables
 * - BackendStack: Lambda + API Gateway
 * - FrontendStack: ECR + Fargate + ALB
 */

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-2',
};

// Stack naming prefix
const prefix = app.node.tryGetContext('prefix') || 'Fixit';

// 1. Network Stack - VPC and security groups
const networkStack = new NetworkStack(app, `${prefix}NetworkStack`, {
  env,
  description: 'Fixit Network Infrastructure - VPC, subnets, security groups',
});

// 2. Database Stack - DynamoDB tables
const databaseStack = new DatabaseStack(app, `${prefix}DatabaseStack`, {
  env,
  description: 'Fixit Database Infrastructure - DynamoDB tables',
});

// 3. Backend Stack - Lambda + API Gateway
const backendStack = new BackendStack(app, `${prefix}BackendStack`, {
  env,
  description: 'Fixit Backend Infrastructure - Lambda, API Gateway',
  databaseStack,
});
backendStack.addDependency(databaseStack);

// 4. Frontend Stack - Fargate + ALB
// Uses ECR repository - build and push image via scripts/deploy-frontend.ps1
const frontendStack = new FrontendStack(app, `${prefix}FrontendStack`, {
  env,
  description: 'Fixit Frontend Infrastructure - ECR, Fargate, ALB',
  vpc: networkStack.vpc,
  backendApiUrl: backendStack.apiUrl,
});
frontendStack.addDependency(networkStack);
frontendStack.addDependency(backendStack);

// Add tags to all stacks
const tags = cdk.Tags.of(app);
tags.add('Project', 'Fixit');
tags.add('ManagedBy', 'CDK');
tags.add('Environment', process.env.ENVIRONMENT || 'production');

app.synth();
