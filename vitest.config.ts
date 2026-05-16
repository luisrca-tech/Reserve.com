import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: "node",
		include: ["src/**/*.{test,spec}.ts"],
		env: {
			NODE_ENV: "test",
			SKIP_ENV_VALIDATION: "true",
			DATABASE_URL: "postgres://test:test@localhost:5432/test",
		},
	},
});
