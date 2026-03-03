// PM2 Ecosystem — Autobat API
// Usage : pm2 start ecosystem.config.js --env production
module.exports = {
  apps: [
    {
      name: 'autobat-api',
      script: 'src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true
    }
  ]
};
