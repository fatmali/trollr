// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import 'jest-canvas-mock';
import { TextDecoder, TextEncoder } from 'util';

// Mock Next.js router
import { useRouter } from 'next/router';
import mockRouter from 'next-router-mock';

jest.mock('next/router', () => require('next-router-mock'));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock global objects that aren't available in jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock canvas-confetti
jest.mock('canvas-confetti', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => Promise.resolve()),
}));