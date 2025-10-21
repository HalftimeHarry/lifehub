import { sveltekit } from '@sveltejs/kit/vite';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit()],
	server: {
		host: '0.0.0.0',
		allowedHosts: ['.gitpod.dev', '.gitpod.io'],
		proxy: {
			'/pb': {
				target: 'http://localhost:8090',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/pb/, '')
			}
		}
	}
};

export default config;
