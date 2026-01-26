import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * DatabaseStack
 *
 * Creates DynamoDB tables for the FitIt application:
 * - Products table (with category GSI)
 * - Service Profiles table (with profession GSI)
 * - Service Requests table (with customerId and status GSIs)
 * - Chat table (with sessionId partition key and timestamp sort key)
 */
export class DatabaseStack extends cdk.Stack {
  public readonly productsTable: dynamodb.Table;
  public readonly serviceProfilesTable: dynamodb.Table;
  public readonly serviceRequestsTable: dynamodb.Table;
  public readonly chatTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    // Products Table
    // ============================================
    this.productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'fitit-products',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect production data
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    this.productsTable.addGlobalSecondaryIndex({
      indexName: 'category-index',
      partitionKey: {
        name: 'category',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================
    // Service Profiles Table
    // ============================================
    this.serviceProfilesTable = new dynamodb.Table(this, 'ServiceProfilesTable', {
      tableName: 'fitit-service-profiles',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    this.serviceProfilesTable.addGlobalSecondaryIndex({
      indexName: 'profession-index',
      partitionKey: {
        name: 'profession',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================
    // Service Requests Table
    // ============================================
    this.serviceRequestsTable = new dynamodb.Table(this, 'ServiceRequestsTable', {
      tableName: 'fitit-service-requests',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    this.serviceRequestsTable.addGlobalSecondaryIndex({
      indexName: 'customerId-index',
      partitionKey: {
        name: 'customerId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    this.serviceRequestsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================
    // Chat Table
    // ============================================
    this.chatTable = new dynamodb.Table(this, 'ChatTable', {
      tableName: 'fitit-chat',
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      timeToLiveAttribute: 'ttl', // Auto-expire old chat messages
    });

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, 'ProductsTableName', {
      value: this.productsTable.tableName,
      description: 'Products DynamoDB Table Name',
      exportName: 'FititProductsTableName',
    });

    new cdk.CfnOutput(this, 'ServiceProfilesTableName', {
      value: this.serviceProfilesTable.tableName,
      description: 'Service Profiles DynamoDB Table Name',
      exportName: 'FititServiceProfilesTableName',
    });

    new cdk.CfnOutput(this, 'ServiceRequestsTableName', {
      value: this.serviceRequestsTable.tableName,
      description: 'Service Requests DynamoDB Table Name',
      exportName: 'FititServiceRequestsTableName',
    });

    new cdk.CfnOutput(this, 'ChatTableName', {
      value: this.chatTable.tableName,
      description: 'Chat DynamoDB Table Name',
      exportName: 'FititChatTableName',
    });
  }
}
