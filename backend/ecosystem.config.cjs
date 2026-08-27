/**
 * File: ecosystem.config.cjs
 * Purpose: PM2 Production Configuration for Coconut Cocktail Backend
 *
 * NOTE: This file uses the .cjs extension because backend/package.json
 * sets "type": "module" (PM2 loads this file with CommonJS require).
 *
 * Deploy with (from the backend/ folder):
 *   pm2 start ecosystem.config.cjs
 *
 * RELEASE WORKFLOW:
 *   Keep ONLY the env block for your target environment uncommented
 *   (LOCAL / TESTING / LIVE), matching backend/.env, then:
 *     cd backend && npm run build
 *     pm2 start ecosystem.config.cjs
 *   PM2 env values take precedence over backend/.env (dotenv does not
 *   override already-set process.env values).
 */

require('dotenv').config()

module.exports = {
  apps: [
    {
      // ============================================
      // Application Configuration
      // ============================================
      name: 'coconut-cocktail-backend',
      description: 'Coconut Cocktail ERP Backend API',

      // Script and Interpreter (backend build output)
      script: './dist/server.js',
      cwd: __dirname,
      interpreter: 'node',

      // Execution Mode & Instances
      instances: 1,
      exec_mode: 'fork',

      // ============================================
      // [A] LOCAL ENVIRONMENT (Development) - comment to deactivate
      // ============================================
      env: {
        NODE_ENV: 'development',
        PORT: process.env.PORT || '4004',
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'CoconutCocktailDB',
        DB_USER: process.env.DB_USER || 'postgres',
        DB_PASSWORD: process.env.DB_PASSWORD || 'NewPassword@123',
        API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:4004',
        FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8000',
      },

      // [B] TESTING SERVER (R & D) - ACTIVE
      // env: {
      //   NODE_ENV: 'production',
      //   PORT: process.env.PORT || '3003',
      //   DB_HOST: process.env.DB_HOST || '192.168.1.230',
      //   DB_PORT: process.env.DB_PORT || '5432',
      //   DB_NAME: process.env.DB_NAME || 'CoconutCocktailDB',
      //   DB_USER: process.env.DB_USER || 'postgres',
      //   DB_PASSWORD: process.env.DB_PASSWORD || 'sa@123',
      //   API_BASE_URL: process.env.API_BASE_URL || 'http://192.168.1.230:3003',
      //   FRONTEND_URL: process.env.FRONTEND_URL || 'http://192.168.1.230:92',
      // },

      // [C] LIVE / PRODUCTION SERVER - uncomment & fill in to activate
      // env: {
      //   NODE_ENV: 'production',
      //   PORT: process.env.PORT || '3005',
      //   DB_HOST: process.env.DB_HOST || 'localhost',
      //   DB_PORT: process.env.DB_PORT || '5432',
      //   DB_NAME: process.env.DB_NAME || 'CoconutCocktailDB',
      //   DB_USER: process.env.DB_USER || 'postgres',
      //   DB_PASSWORD: process.env.DB_PASSWORD || 'StrongPassword@123',
      //   DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:StrongPassword@123@localhost:5432/CoconutCocktailDB',
      //   API_BASE_URL: process.env.API_BASE_URL || 'http://109.199.106.107:3005',
      //   FRONTEND_URL: process.env.FRONTEND_URL || 'http://109.199.106.107',
      // },

      // ============================================
      // Logging Configuration
      // ============================================
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // ============================================
      // Auto-Restart & Monitoring
      // ============================================
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', 'dist'],

      // ============================================
      // Memory & Performance
      // ============================================
      max_memory_restart: '500M',

      // ============================================
      // Graceful Shutdown
      // ============================================
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,

      // ============================================
      // Health Check & Monitoring
      // ============================================
      max_restarts: 10,
      min_uptime: '10s',

      // ============================================
      // Environment-Specific Settings
      // ============================================
      source_map_support: false,

      // Restart strategies
      exp_backoff_restart_delay: 100,
    },
  ],
}
