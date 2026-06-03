import { DataTypes } from 'sequelize';
import sequelize from '../connection.js';

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  matchId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  questionType: {
    type: DataTypes.ENUM('MCQ', 'short'),
    defaultValue: 'MCQ'
  },
  options: {
    type: DataTypes.JSON, // Supported by MySQL/Sequelize
    allowNull: true
  },
  correctAnswer: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  explanation: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

export default Question;
