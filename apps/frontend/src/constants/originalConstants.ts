import { Product, ServiceProfile, ServiceRequest } from './types';

export const TOOLS_DATA: Product[] = [
  {
    id: 't1',
    name: 'Cordless Drill Driver',
    price: 89.99,
    category: 'Power Tools',
    image: 'https://picsum.photos/300/300?random=1',
    description: '18V Cordless Drill with 2 batteries. Essential for any home repair.',
    rating: 4.8
  },
  {
    id: 't2',
    name: 'Pro Claw Hammer',
    price: 24.50,
    category: 'Hand Tools',
    image: 'https://picsum.photos/300/300?random=2',
    description: 'Forged steel head with shock reduction grip.',
    rating: 4.9
  },
  {
    id: 't3',
    name: 'Digital Multimeter',
    price: 45.00,
    category: 'Electrical',
    image: 'https://picsum.photos/300/300?random=3',
    description: 'Measure voltage, current, and resistance safely.',
    rating: 4.6
  },
  {
    id: 't4',
    name: 'Pipe Wrench Set',
    price: 35.99,
    category: 'Plumbing',
    image: 'https://picsum.photos/300/300?random=4',
    description: 'Heavy duty pipe wrenches for plumbing tasks.',
    rating: 4.5
  },
  {
    id: 't5',
    name: 'Safety Goggles',
    price: 12.00,
    category: 'Safety',
    image: 'https://picsum.photos/300/300?random=5',
    description: 'Anti-fog safety glasses for eye protection.',
    rating: 4.7
  },
  {
    id: 't6',
    name: 'Circular Saw',
    price: 120.00,
    category: 'Power Tools',
    image: 'https://picsum.photos/300/300?random=6',
    description: '7-1/4 inch circular saw for wood cutting.',
    rating: 4.8
  }
];

export const SERVICE_PROS: ServiceProfile[] = [
  {
    id: 'p1',
    name: 'John Watts',
    profession: 'Electrician',
    rate: 85,
    rating: 4.9,
    image: 'https://picsum.photos/200/200?random=10',
    available: true
  },
  {
    id: 'p2',
    name: 'Mike Hammer',
    profession: 'Carpenter',
    rate: 70,
    rating: 4.7,
    image: 'https://picsum.photos/200/200?random=11',
    available: true
  },
  {
    id: 'p3',
    name: 'Sarah Pipes',
    profession: 'Plumber',
    rate: 95,
    rating: 5.0,
    image: 'https://picsum.photos/200/200?random=12',
    available: false
  }
];

export const INITIAL_REQUESTS: ServiceRequest[] = [
  {
    id: 'r1',
    customerId: 'c1',
    customerName: 'Alice Johnson',
    description: 'Kitchen light fixture is flickering and making a buzzing sound.',
    category: 'Electrical',
    status: 'OPEN',
    date: '2023-10-27'
  },
  {
    id: 'r2',
    customerId: 'c2',
    customerName: 'Bob Smith',
    description: 'Need help assembling a large wooden wardrobe.',
    category: 'Carpenter',
    status: 'OPEN',
    date: '2023-10-26'
  }
];
