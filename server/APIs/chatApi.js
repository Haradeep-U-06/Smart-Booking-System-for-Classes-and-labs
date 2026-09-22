const exp = require('express')
const chatApp = exp.Router()
const Message = require('../models/messageModel')
const Conversation = require('../models/conversationModel')
const expressAsyncHandler = require('express-async-handler')

/* Get conversation by leaveId */
chatApp.get(
  "/convo/:leaveId",
  expressAsyncHandler(async (req, res) => {
    const { leaveId } = req.params

    const conversation = await Conversation.findOne({ contextId: leaveId })
    if (!conversation) {
      return res.status(404).send({ error: "Conversation not found" })
    }

    res.status(200).send({
      message: "Conversation found",
      payload: conversation
    })
  })
)

/* Get messages */
chatApp.get(
  "/messages/:conversationId",
  expressAsyncHandler(async (req, res) => {
    const { conversationId } = req.params

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).send({ error: "Conversation not found" })
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })

    res.status(200).send({
      message: "Messages retrieved",
      payload: messages,
      conversationStatus: conversation.status
    })
  })
)

/* Send message (TEMP MongoDB ID based) */
chatApp.post(
  "/message/:conversationId",
  expressAsyncHandler(async (req, res) => {
    const { conversationId } = req.params
    const { senderId, senderRole, content } = req.body

    if (!senderId || !senderRole || !content) {
      return res.status(400).send({ error: "Missing fields" })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).send({ error: "Conversation not found" })
    }

    /* Participant check */
    if (
      conversation.participants.teacherId.toString() !== senderId &&
      conversation.participants.adminId.toString() !== senderId
    ) {
      return res.status(403).send({ error: "Access denied" })
    }

    if (conversation.status === "LOCKED") {
      return res.status(403).send({
        error: "Conversation is locked. No more messages allowed."
      })
    }

    const newMessage = await Message.create({
      conversationId,
      senderId,
      senderRole,
      content
    })

    res.status(201).send({
      message: "Message sent",
      payload: newMessage
    })
  })
)



module.exports = chatApp
