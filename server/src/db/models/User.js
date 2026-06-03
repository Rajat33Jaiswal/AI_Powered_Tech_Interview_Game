import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  gamesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  avgScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  maxScore: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  }
}, {
  timestamps: true
});

export default User;
