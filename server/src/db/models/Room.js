import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  roomCode: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true
  },
  hostId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('lobby', 'playing', 'finished'),
    defaultValue: 'lobby'
  },
  topic: {
    type: DataTypes.STRING,
    allowNull: false
  },
  difficulty: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roundCount: {
    type: DataTypes.INTEGER,
    defaultValue: 10
  }
}, {
  timestamps: true
});

export default Room;
