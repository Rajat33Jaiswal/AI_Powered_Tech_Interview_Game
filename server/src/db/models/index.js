import User from './User.js';
import Room from './Room.js';
import Match from './Match.js';
import Question from './Question.js';
import Answer from './Answer.js';
import MatchParticipant from './MatchParticipant.js';

// User <-> Room (Host relationship)
Room.belongsTo(User, { as: 'host', foreignKey: 'hostId', onDelete: 'CASCADE' });
User.hasMany(Room, { as: 'hostedRooms', foreignKey: 'hostId', onDelete: 'CASCADE' });

// Room <-> Match
Match.belongsTo(Room, { foreignKey: 'roomId', allowNull: true, onDelete: 'SET NULL' });
Room.hasMany(Match, { foreignKey: 'roomId', onDelete: 'SET NULL' });

// Match <-> Question
Question.belongsTo(Match, { foreignKey: 'matchId', onDelete: 'CASCADE' });
Match.hasMany(Question, { foreignKey: 'matchId', onDelete: 'CASCADE' });

// Match <-> Answer
Answer.belongsTo(Match, { foreignKey: 'matchId', onDelete: 'CASCADE' });
Match.hasMany(Answer, { foreignKey: 'matchId', onDelete: 'CASCADE' });

// User <-> Answer
Answer.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Answer, { foreignKey: 'userId', onDelete: 'CASCADE' });

// Question <-> Answer
Answer.belongsTo(Question, { foreignKey: 'questionId', onDelete: 'CASCADE' });
Question.hasMany(Answer, { foreignKey: 'questionId', onDelete: 'CASCADE' });

// MatchParticipant relations
MatchParticipant.belongsTo(Match, { foreignKey: 'matchId', onDelete: 'CASCADE' });
Match.hasMany(MatchParticipant, { foreignKey: 'matchId', onDelete: 'CASCADE' });

MatchParticipant.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(MatchParticipant, { foreignKey: 'userId', onDelete: 'CASCADE' });

export {
  User,
  Room,
  Match,
  Question,
  Answer,
  MatchParticipant
};
