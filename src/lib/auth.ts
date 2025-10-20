import { writable } from 'svelte/store';
import { pb } from './pb';
import type { AuthModel } from 'pocketbase';

export const currentUser = writable<AuthModel | null>(pb.authStore.model);

// Subscribe to auth changes
pb.authStore.onChange((token, model) => {
	currentUser.set(model);
});

export async function login(email: string, password: string) {
	try {
		const authData = await pb.collection('users').authWithPassword(email, password);
		return { success: true, user: authData.record };
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : 'Login failed' };
	}
}

export async function signup(email: string, password: string, passwordConfirm: string, name?: string) {
	try {
		const data = {
			email,
			password,
			passwordConfirm,
			name: name || email.split('@')[0]
		};
		
		const record = await pb.collection('users').create(data);
		
		// Auto-login after signup
		await pb.collection('users').authWithPassword(email, password);
		
		return { success: true, user: record };
	} catch (error) {
		return { success: false, error: error instanceof Error ? error.message : 'Signup failed' };
	}
}

export function logout() {
	pb.authStore.clear();
}

export function isAuthenticated(): boolean {
	return pb.authStore.isValid;
}
