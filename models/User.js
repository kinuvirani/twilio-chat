let mongoose = require('mongoose');
let Schema= mongoose.Schema;

const UserSchema = new Schema(
  {
    firstname: {
      type: String
    },
    lastname: {
      type: String
    },
    email: {
      type: String,
      required: true
    },
    contact_no: {
      type: String
    },
    profile_img: {
      type: String
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    collection: 'User',
    timestamp: {createdAt: 'created_at', updatedAt: 'updated_at'}
  }
);

module.exports= mongoose.model('User', UserSchema);