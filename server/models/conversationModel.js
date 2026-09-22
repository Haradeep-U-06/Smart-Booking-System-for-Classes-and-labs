const mongoose=require('mongoose')

const conversationSchema=new mongoose.Schema({
  contextType: {
    type: String,
    enum: ["LEAVE"],
    required: true
  },
  contextId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "leaveapplications",
    required: true
  },
  participants: {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  status: {
    type: String,
    enum: ["OPEN", "LOCKED"],
    default: "OPEN"
  }
}, { timestamps: true });

module.exports=mongoose.model('Conversation',conversationSchema);