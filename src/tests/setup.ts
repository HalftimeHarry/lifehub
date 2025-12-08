import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock environment variables
process.env.VITE_POCKETBASE_URL = 'http://localhost:8090';
process.env.TWILIO_ACCOUNT_SID = 'test_sid';
process.env.TWILIO_AUTH_TOKEN = 'test_token';
process.env.TWILIO_FROM = '+1234567890';
process.env.NOTIFY_TIMEZONE = 'America/Los_Angeles';
process.env.REMINDER_LOOKAHEAD_MIN = '90';

// Mock window.localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};
global.localStorage = localStorageMock as any;
