import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres', // Shyira 'postgres' mu buryo bugaragara
    dialectOptions: {
      ssl: {
        require: true,        // Ibi nikintu cy'ibanze
        rejectUnauthorized: false // (Niba ufite ikibazo cy'icyemezo, ariko wenda uragikemura)
      }
    },
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;