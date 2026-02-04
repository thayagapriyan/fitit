import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction, OutputFormat } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import * as path from 'path';

/**
 * BackendStackProps
 */
export interface BackendStackProps extends cdk.StackProps {
  databaseStack: DatabaseStack;
}

/**
 * BackendStack
 *
 * Deploys the Hono.js backend as:
 * - AWS Lambda function (Node.js 20)
 * - HTTP API Gateway with CORS
 * - Secrets Manager integration for API keys
 */
export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;
  public readonly lambdaFunction: NodejsFunction;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { databaseStack } = props;

    // ============================================
    // Secrets (Optional - create manually or via CLI)
    // ============================================
    // Reference existing secret (create manually):
    // aws secretsmanager create-secret --name /fixit/production/gemini-api-key --secret-string "your-key"
    const geminiSecretArn = this.node.tryGetContext('geminiSecretArn');

    // Log group for Lambda
    const logGroup = new logs.LogGroup(this, 'BackendLogGroup', {
      logGroupName: '/aws/lambda/fixit-backend',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============================================
    // Lambda Function (using NodejsFunction - no Docker required)
    // ============================================
    this.lambdaFunction = new NodejsFunction(this, 'BackendLambda', {
      functionName: 'fixit-backend',
      description: 'Fixit Backend API - Hono.js on Lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../../../apps/backend/src/lambda.ts'),
      handler: 'handler',
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64,
      environment: {
        NODE_ENV: 'production',
        DYNAMODB_PRODUCTS_TABLE: databaseStack.productsTable.tableName,
        DYNAMODB_SERVICE_PROFILES_TABLE: databaseStack.serviceProfilesTable.tableName,
        DYNAMODB_SERVICE_REQUESTS_TABLE: databaseStack.serviceRequestsTable.tableName,
        DYNAMODB_CHAT_TABLE: databaseStack.chatTable.tableName,
        DYNAMODB_USERS_TABLE: databaseStack.usersTable.tableName,
        ...(geminiSecretArn && { GEMINI_API_KEY_SECRET_ARN: geminiSecretArn }),
      },
      logGroup,
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node20',
        // Exclude AWS SDK (provided by Lambda runtime)
        externalModules: ['@aws-sdk/*'],
        // Use esbuild format compatible with ESM
        format: OutputFormat.ESM,
        banner: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
    });

    // Grant DynamoDB permissions
    databaseStack.productsTable.grantReadWriteData(this.lambdaFunction);
    databaseStack.serviceProfilesTable.grantReadWriteData(this.lambdaFunction);
    databaseStack.serviceRequestsTable.grantReadWriteData(this.lambdaFunction);
    databaseStack.chatTable.grantReadWriteData(this.lambdaFunction);
    databaseStack.usersTable.grantReadWriteData(this.lambdaFunction);
    databaseStack.countersTable.grantReadWriteData(this.lambdaFunction);

    // Grant Secrets Manager read permission (if secret ARN provided)
    if (geminiSecretArn) {
      const geminiSecret = secretsmanager.Secret.fromSecretCompleteArn(
        this,
        'GeminiSecret',
        geminiSecretArn
      );
      geminiSecret.grantRead(this.lambdaFunction);
    }

    // ============================================
    // HTTP API Gateway
    // ============================================
    const httpApi = new apigatewayv2.HttpApi(this, 'BackendApi', {
      apiName: 'fixit-backend-api',
      description: 'Fixit Backend HTTP API',
      corsPreflight: {
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        allowMethods: [
          apigatewayv2.CorsHttpMethod.GET,
          apigatewayv2.CorsHttpMethod.POST,
          apigatewayv2.CorsHttpMethod.PUT,
          apigatewayv2.CorsHttpMethod.PATCH,
          apigatewayv2.CorsHttpMethod.DELETE,
          apigatewayv2.CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ['*'], // Restrict in production to your frontend domain
        maxAge: cdk.Duration.days(1),
      },
    });

    // Lambda integration
    const lambdaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      this.lambdaFunction
    );

    // Catch-all route
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: lambdaIntegration,
    });

    // Root route for health check
    httpApi.addRoutes({
      path: '/',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: lambdaIntegration,
    });

    this.apiUrl = httpApi.apiEndpoint;

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.apiUrl,
      description: 'Backend API URL',
      exportName: 'FititBackendApiUrl',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.lambdaFunction.functionName,
      description: 'Lambda Function Name',
      exportName: 'FixitBackendLambdaName',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
    });
  }
}
