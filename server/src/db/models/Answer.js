import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  matchId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userAnswer: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  score: {
    type: DataTypes.INTEGER, // 0 to 10 points
    defaultValue: 0
  },
  feedbackText: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseTimeSeconds: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  timestamps: true
});

export default Answer;
