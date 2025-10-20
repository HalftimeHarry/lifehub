import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Add any server-side auth checks here if needed
	return resolve(event);
};
