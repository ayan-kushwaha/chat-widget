// This file is for PM2 (Production Process Manager)
//ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'api-server',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
    },
    {
      name: 'crawl-worker',
      script: 'dist/jobs/crawl.worker.js',
      instances: 1,
      exec_mode: 'fork',
    },
    {
      name: 'embed-worker',
      script: 'dist/jobs/embed.worker.js',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=8192',
    },
  ],
};
