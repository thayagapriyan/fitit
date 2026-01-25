/**
 * Test setup file
 * Configure global test utilities, mocks, and environment setup here
 */

// Example: Setup global test utilities
// import '@testing-library/jest-dom';

// Example: Mock environment variables
process.env.NODE_ENV = 'test';

// Example: Setup global mocks
global.fetch = jest.fn();

// Example: Configure test timeout
jest.setTimeout(10000);

export {};
