import { writable } from 'svelte/store';
import { pb } from './pb';
import type { AuthModel } from 'pocketbase';

export const currentUser = writable<AuthModel | null>(pb.authStore.model);

console.log('[AUTH STORE] Initial user:', pb.authStore.model);

// Subscribe to auth changes
pb.authStore.onChange((token, model) => {
	console.log('[AUTH STORE] Auth changed - Token:', !!token, 'Model:', model);
	currentUser.set(model);
});

export async function login(email: string, password: string) {
	try {
		console.log('[AUTH] Attempting login for:', email);
		const authData = await pb.collection('users').authWithPassword(email, password);
		console.log('[AUTH] Login successful:', authData.record);
		console.log('[AUTH] Auth store valid:', pb.authStore.isValid);
		console.log('[AUTH] Auth store model:', pb.authStore.model);
		return { success: true, user: authData.record };
	} catch (error) {
		console.error('[AUTH] Login failed:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
	}
}

export async function signup(email: string, password: string, passwordConfirm: string, name?: string) {
	try {
		console.log('[AUTH] Attempting signup for:', email);
		const data = {
			email,
			password,
			passwordConfirm,
			name: name || email.split('@')[0]
		};
		
		const record = await pb.collection('users').create(data);
		console.log('[AUTH] User created:', record);
		
		// Auto-login after signup
		const authData = await pb.collection('users').authWithPassword(email, password);
		console.log('[AUTH] Auto-login successful:', authData.record);
		console.log('[AUTH] Auth store valid:', pb.authStore.isValid);
		console.log('[AUTH] Auth store model:', pb.authStore.model);
		
		return { success: true, user: record };
	} catch (error) {
		console.error('[AUTH] Signup failed:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
	}
}

export function logout() {
	pb.authStore.clear();
}

export function isAuthenticated(): boolean {
	return pb.authStore.isValid;
}
