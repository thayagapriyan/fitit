import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
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
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const { databaseStack } = props;

    // ============================================
    // Secrets (Optional - create manually or via CLI)
    // ============================================
    // Reference existing secret (create manually):
    // aws secretsmanager create-secret --name /fitit/production/gemini-api-key --secret-string "your-key"
    const geminiSecretArn = this.node.tryGetContext('geminiSecretArn');

    // ============================================
    // Lambda Function
    // ============================================
    this.lambdaFunction = new lambda.Function(this, 'BackendLambda', {
      functionName: 'fitit-backend',
      description: 'FitIt Backend API - Hono.js on Lambda',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../apps/backend'), {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            'bash', '-c', [
              'npm ci --omit=dev',
              'npm run build',
              'cp -r dist/* /asset-output/',
              'cp -r node_modules /asset-output/',
            ].join(' && '),
          ],
          environment: {
            NODE_ENV: 'production',
          },
        },
      }),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      architecture: lambda.Architecture.ARM_64, // Cost-effective
      environment: {
        NODE_ENV: 'production',
        // Note: AWS_REGION is automatically set by Lambda runtime
        DYNAMODB_PRODUCTS_TABLE: databaseStack.productsTable.tableName,
        DYNAMODB_SERVICE_PROFILES_TABLE: databaseStack.serviceProfilesTable.tableName,
        DYNAMODB_SERVICE_REQUESTS_TABLE: databaseStack.serviceRequestsTable.tableName,
        DYNAMODB_CHAT_TABLE: databaseStack.chatTable.tableName,
        // GEMINI_API_KEY will be fetched from Secrets Manager at runtime
        ...(geminiSecretArn && { GEMINI_API_KEY_SECRET_ARN: geminiSecretArn }),
      },
      logGroup: new logs.LogGroup(this, 'BackendLogGroup', {
        logGroupName: '/aws/lambda/fitit-backend',
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    });

    // Grant DynamoDB permissions
    databaseStack.productsTable.grantReadWriteData(this.lambdaFunction);
    databaseStack.serviceProfilesTable.grantReadWriteData(this.lambdaFunction);
    databaseStack.serviceRequestsTable.grantReadWriteData(this.lambdaFunction);
    databaseStack.chatTable.grantReadWriteData(this.lambdaFunction);

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
      apiName: 'fitit-backend-api',
      description: 'FitIt Backend HTTP API',
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
      exportName: 'FititBackendLambdaName',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'Lambda Function ARN',
    });
  }
}
