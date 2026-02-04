import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';

/**
 * DynamoDB Table Creation Script
 * Run with: npm run create-tables
 */

const AWS_REGION = process.env.AWS_REGION || 'us-east-2';

const client = new DynamoDBClient({
  region: AWS_REGION,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
});

interface TableDefinition {
  name: string;
  partitionKey: { name: string; type: 'S' | 'N' };
  sortKey?: { name: string; type: 'S' | 'N' };
  globalSecondaryIndexes?: {
    name: string;
    partitionKey: { name: string; type: 'S' | 'N' };
    sortKey?: { name: string; type: 'S' | 'N' };
  }[];
}

const tables: TableDefinition[] = [
  {
    name: process.env.DYNAMODB_PRODUCTS_TABLE || 'fixit-products',
    partitionKey: { name: 'id', type: 'S' },
    globalSecondaryIndexes: [
      {
        name: 'category-index',
        partitionKey: { name: 'category', type: 'S' },
      },
    ],
  },
  {
    name: process.env.DYNAMODB_SERVICE_PROFILES_TABLE || 'fixit-service-profiles',
    partitionKey: { name: 'id', type: 'S' },
    globalSecondaryIndexes: [
      {
        name: 'profession-index',
        partitionKey: { name: 'profession', type: 'S' },
      },
    ],
  },
  {
    name: process.env.DYNAMODB_SERVICE_REQUESTS_TABLE || 'fixit-service-requests',
    partitionKey: { name: 'id', type: 'S' },
    globalSecondaryIndexes: [
      {
        name: 'customerId-index',
        partitionKey: { name: 'customerId', type: 'S' },
      },
      {
        name: 'status-index',
        partitionKey: { name: 'status', type: 'S' },
      },
    ],
  },
  {
    name: process.env.DYNAMODB_CHAT_TABLE || 'fixit-chat',
    partitionKey: { name: 'sessionId', type: 'S' },
    sortKey: { name: 'timestamp', type: 'S' },
  },
];

async function tableExists(tableName: string): Promise<boolean> {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      return false;
    }
    throw error;
  }
}

async function createTable(table: TableDefinition): Promise<void> {
  const exists = await tableExists(table.name);

  if (exists) {
    console.log(`⏭️  Table ${table.name} already exists, skipping...`);
    return;
  }

  console.log(`📦 Creating table: ${table.name}...`);

  const keySchema: { AttributeName: string; KeyType: 'HASH' | 'RANGE' }[] = [
    { AttributeName: table.partitionKey.name, KeyType: 'HASH' },
  ];

  const attributeDefinitions: { AttributeName: string; AttributeType: 'S' | 'N' | 'B' }[] = [
    { AttributeName: table.partitionKey.name, AttributeType: table.partitionKey.type },
  ];

  if (table.sortKey) {
    keySchema.push({ AttributeName: table.sortKey.name, KeyType: 'RANGE' });
    attributeDefinitions.push({
      AttributeName: table.sortKey.name,
      AttributeType: table.sortKey.type,
    });
  }

  // Add GSI attribute definitions
  if (table.globalSecondaryIndexes) {
    for (const gsi of table.globalSecondaryIndexes) {
      if (!attributeDefinitions.find(a => a.AttributeName === gsi.partitionKey.name)) {
        attributeDefinitions.push({
          AttributeName: gsi.partitionKey.name,
          AttributeType: gsi.partitionKey.type,
        });
      }
      if (gsi.sortKey && !attributeDefinitions.find(a => a.AttributeName === gsi.sortKey!.name)) {
        attributeDefinitions.push({
          AttributeName: gsi.sortKey.name,
          AttributeType: gsi.sortKey.type,
        });
      }
    }
  }

  const globalSecondaryIndexes = table.globalSecondaryIndexes?.map(gsi => ({
    IndexName: gsi.name,
    KeySchema: [
      { AttributeName: gsi.partitionKey.name, KeyType: 'HASH' as const },
      ...(gsi.sortKey ? [{ AttributeName: gsi.sortKey.name, KeyType: 'RANGE' as const }] : []),
    ],
    Projection: { ProjectionType: 'ALL' as const },
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5,
    },
  }));

  try {
    await client.send(
      new CreateTableCommand({
        TableName: table.name,
        KeySchema: keySchema,
        AttributeDefinitions: attributeDefinitions,
        BillingMode: 'PAY_PER_REQUEST', // On-demand pricing
        ...(globalSecondaryIndexes && globalSecondaryIndexes.length > 0 && {
          GlobalSecondaryIndexes: globalSecondaryIndexes.map(gsi => ({
            ...gsi,
            ProvisionedThroughput: undefined, // Not needed for PAY_PER_REQUEST
          })),
        }),
      })
    );

    console.log(`✅ Created table: ${table.name}`);
  } catch (error) {
    console.error(`❌ Failed to create table ${table.name}:`, error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting DynamoDB table creation...');
  console.log(`📍 Region: ${AWS_REGION}`);
  console.log('');

  for (const table of tables) {
    await createTable(table);
  }

  console.log('');
  console.log('✅ All tables processed successfully!');
  console.log('');
  console.log('📋 Table Summary:');
  for (const table of tables) {
    console.log(`   - ${table.name}`);
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
