import PocketBase, { type AuthModel } from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

// Persist auth in browser
if (typeof window !== 'undefined') {
	const raw = localStorage.getItem('pb_auth');
	if (raw) {
		try {
			const { token, model } = JSON.parse(raw) as { token: string; model: AuthModel };
			pb.authStore.save(token, model);
		} catch {}
	}
	pb.authStore.onChange(() => {
		const token = pb.authStore.token;
		const model = pb.authStore.model;
		if (token && model) localStorage.setItem('pb_auth', JSON.stringify({ token, model }));
		else localStorage.removeItem('pb_auth');
	});
}
