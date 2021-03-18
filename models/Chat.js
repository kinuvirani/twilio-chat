let mongoose = require('mongoose');
let Schema = mongoose.Schema;

const ChatSchema = new Schema(
  {
    'users': [
      {
        type: String,
        required: true
      }
    ],
    'channel_url': {
      type: String
    },
    'channel_sid': {
      type: String
    }
  },
  {
    collection: 'Chat',
    timestamps: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports = mongoose.model('Chat', ChatSchema);