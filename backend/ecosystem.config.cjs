module.exports = {
  apps: [
    {
      name: "decory-api",
      script: "src/server.ts",
      interpreter: "./node_modules/tsx/dist/cli.mjs",
      cwd: __dirname,
      env: { NODE_ENV: "production" },
    },
    {
      name: "decory-worker",
      script: "src/worker/index.ts",
      interpreter: "./node_modules/tsx/dist/cli.mjs",
      cwd: __dirname,
      env: { NODE_ENV: "production" },
    },
  ],
};
