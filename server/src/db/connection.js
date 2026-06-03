import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || 3306;
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'interview_game';

console.log(`Connecting to database ${dbName} at ${dbHost}:${dbPort}...`);

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false, // Set to console.log for debugging query execution
  dialectOptions: {
    // Necessary for SSL connections in PlanetScale / Railway if enabled
    ssl: process.env.DB_SSL === 'true' ? {
      rejectUnauthorized: true
    } : null
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
