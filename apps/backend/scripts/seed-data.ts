import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Seed Data Script
 * Inserts sample data into DynamoDB tables
 * Run with: npm run seed-data
 */

const AWS_REGION = process.env.AWS_REGION || 'us-east-2';

const baseClient = new DynamoDBClient({
  region: AWS_REGION,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
});

const client = DynamoDBDocumentClient.from(baseClient);

// Table names
const TABLES = {
  PRODUCTS: process.env.DYNAMODB_PRODUCTS_TABLE || 'fixit-products',
  SERVICE_PROFILES: process.env.DYNAMODB_SERVICE_PROFILES_TABLE || 'fixit-service-profiles',
  SERVICE_REQUESTS: process.env.DYNAMODB_SERVICE_REQUESTS_TABLE || 'fixit-service-requests',
};

// Sample Products
const PRODUCTS = [
  {
    id: 't1',
    name: 'Cordless Drill Driver',
    price: 89.99,
    category: 'Power Tools',
    image: 'https://picsum.photos/300/300?random=1',
    description: '18V Cordless Drill with 2 batteries. Essential for any home repair.',
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't2',
    name: 'Pro Claw Hammer',
    price: 24.50,
    category: 'Hand Tools',
    image: 'https://picsum.photos/300/300?random=2',
    description: 'Forged steel head with shock reduction grip.',
    rating: 4.9,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't3',
    name: 'Digital Multimeter',
    price: 45.00,
    category: 'Electrical',
    image: 'https://picsum.photos/300/300?random=3',
    description: 'Measure voltage, current, and resistance safely.',
    rating: 4.6,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't4',
    name: 'Pipe Wrench Set',
    price: 35.99,
    category: 'Plumbing',
    image: 'https://picsum.photos/300/300?random=4',
    description: 'Heavy duty pipe wrenches for plumbing tasks.',
    rating: 4.5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't5',
    name: 'Safety Goggles',
    price: 12.00,
    category: 'Safety',
    image: 'https://picsum.photos/300/300?random=5',
    description: 'Anti-fog safety glasses for eye protection.',
    rating: 4.7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't6',
    name: 'Circular Saw',
    price: 120.00,
    category: 'Power Tools',
    image: 'https://picsum.photos/300/300?random=6',
    description: '7-1/4 inch circular saw for wood cutting.',
    rating: 4.8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample Service Profiles
const SERVICE_PROFILES = [
  {
    id: 'p1',
    name: 'John Watts',
    profession: 'Electrician',
    rate: 85,
    rating: 4.9,
    image: 'https://picsum.photos/200/200?random=10',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p2',
    name: 'Mike Hammer',
    profession: 'Carpenter',
    rate: 70,
    rating: 4.7,
    image: 'https://picsum.photos/200/200?random=11',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p3',
    name: 'Sarah Pipes',
    profession: 'Plumber',
    rate: 95,
    rating: 5.0,
    image: 'https://picsum.photos/200/200?random=12',
    available: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p4',
    name: 'Tom Cool',
    profession: 'HVAC',
    rate: 90,
    rating: 4.6,
    image: 'https://picsum.photos/200/200?random=13',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p5',
    name: 'Alex Fix',
    profession: 'General Handyman',
    rate: 55,
    rating: 4.4,
    image: 'https://picsum.photos/200/200?random=14',
    available: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample Service Requests
const SERVICE_REQUESTS = [
  {
    id: 'r1',
    customerId: 'c1',
    customerName: 'Alice Johnson',
    description: 'Kitchen light fixture is flickering and making a buzzing sound.',
    category: 'Electrical',
    status: 'OPEN',
    date: '2026-01-25',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'r2',
    customerId: 'c2',
    customerName: 'Bob Smith',
    description: 'Need help assembling a large wooden wardrobe.',
    category: 'Carpenter',
    status: 'OPEN',
    date: '2026-01-24',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'r3',
    customerId: 'c3',
    customerName: 'Carol White',
    description: 'Bathroom faucet is leaking and needs replacement.',
    category: 'Plumbing',
    status: 'IN_PROGRESS',
    date: '2026-01-23',
    professionalId: 'p3',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function seedTable(tableName: string, items: any[], entityName: string): Promise<void> {
  console.log(`\n📦 Seeding ${entityName}...`);
  
  let successCount = 0;
  let errorCount = 0;

  for (const item of items) {
    try {
      await client.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        })
      );
      successCount++;
      console.log(`   ✅ Added: ${item.name || item.customerName || item.id}`);
    } catch (error: any) {
      errorCount++;
      console.error(`   ❌ Failed: ${item.id} - ${error.message}`);
    }
  }

  console.log(`   📊 ${successCount} inserted, ${errorCount} failed`);
}

async function main(): Promise<void> {
  console.log('🌱 Starting data seed...');
  console.log(`📍 Region: ${AWS_REGION}`);

  await seedTable(TABLES.PRODUCTS, PRODUCTS, 'Products');
  await seedTable(TABLES.SERVICE_PROFILES, SERVICE_PROFILES, 'Service Profiles');
  await seedTable(TABLES.SERVICE_REQUESTS, SERVICE_REQUESTS, 'Service Requests');

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Summary:');
  console.log(`   - Products: ${PRODUCTS.length} items`);
  console.log(`   - Service Profiles: ${SERVICE_PROFILES.length} items`);
  console.log(`   - Service Requests: ${SERVICE_REQUESTS.length} items`);
}

main().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
