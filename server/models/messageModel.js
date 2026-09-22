const mongoose=require('mongoose')

const messageSchema=new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "conversations",
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderRole: {
    type: String,
    enum: ["ADMIN", "TEACHER"],
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports=mongoose.model('Message',messageSchema);