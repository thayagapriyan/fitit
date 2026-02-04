import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * DatabaseStack
 *
 * Creates DynamoDB tables for the Fixit application:
 * - Products table (with category GSI)
 * - Service Profiles table (with profession GSI)
 * - Service Requests table (with customerId and status GSIs)
 * - Chat table (with sessionId partition key and timestamp sort key)
 * - Users table (with customerId, email, and role GSIs)
 * - Counters table (for atomic ID generation)
 */
export class DatabaseStack extends cdk.Stack {
  public readonly productsTable: dynamodb.Table;
  public readonly serviceProfilesTable: dynamodb.Table;
  public readonly serviceRequestsTable: dynamodb.Table;
  public readonly chatTable: dynamodb.Table;
  public readonly usersTable: dynamodb.Table;
  public readonly countersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================
    // Products Table
    // ============================================
    this.productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'fixit-products',
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
      tableName: 'fixit-service-profiles',
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
      tableName: 'fixit-chat',
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
    // Users Table
    // ============================================
    this.usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'fitit-users',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
    });

    // GSI for querying by unique customerId
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'customerId-index',
      partitionKey: {
        name: 'customerId',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying by email
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // GSI for querying by role (CUSTOMER or PROFESSIONAL)
    this.usersTable.addGlobalSecondaryIndex({
      indexName: 'role-index',
      partitionKey: {
        name: 'role',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // ============================================
    // Counters Table (for atomic ID generation)
    // ============================================
    this.countersTable = new dynamodb.Table(this, 'CountersTable', {
      tableName: 'fixit-counters',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ============================================
    // Outputs
    // ============================================
    new cdk.CfnOutput(this, 'ProductsTableName', {
      value: this.productsTable.tableName,
      description: 'Products DynamoDB Table Name',
      exportName: 'FixitProductsTableName',
    });

    new cdk.CfnOutput(this, 'ServiceProfilesTableName', {
      value: this.serviceProfilesTable.tableName,
      description: 'Service Profiles DynamoDB Table Name',
      exportName: 'FixitServiceProfilesTableName',
    });

    new cdk.CfnOutput(this, 'ServiceRequestsTableName', {
      value: this.serviceRequestsTable.tableName,
      description: 'Service Requests DynamoDB Table Name',
      exportName: 'FixitServiceRequestsTableName',
    });

    new cdk.CfnOutput(this, 'ChatTableName', {
      value: this.chatTable.tableName,
      description: 'Chat DynamoDB Table Name',
      exportName: 'FixitChatTableName',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'Users DynamoDB Table Name',
      exportName: 'FixitUsersTableName',
    });

    new cdk.CfnOutput(this, 'CountersTableName', {
      value: this.countersTable.tableName,
      description: 'Counters DynamoDB Table Name',
      exportName: 'FixitCountersTableName',
    });
  }
}

