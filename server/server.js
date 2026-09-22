const exp = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const { initSocket } = require("./sck");

const app = exp();
app.use(exp.json());
app.use(cors());

// APIs
const classroomApp = require("./APIs/classroomApi");
const bookingApp = require("./APIs/bookingApi");
const teacherApp = require("./APIs/teacherApi");
const teacherAppId = require("./APIs/teacherIdApi");
const leaveApp = require("./APIs/leaveApi");
const chatApp = require("./APIs/chatApi");

// Routes
app.use("/classroom-api", classroomApp);
app.use("/booking-api", bookingApp);
app.use("/teacher-api", teacherApp);
app.use("/id-teacher-api", teacherAppId);
app.use("/leave-api", leaveApp);
app.use("/chat-api", chatApp);

// 🔑 Create HTTP server
const server = http.createServer(app);

// 🔑 Initialize socket.io ONCE
const io = initSocket(server);

// 🔑 Socket logic
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", (conversationId) => {
    socket.join(conversationId);
  });

  socket.on("leave-room", (conversationId) => {
    socket.leave(conversationId);
  });

  socket.on("send-message", async (payload) => {
    const Message = require("./models/messageModel");
    const Conversation = require("./models/conversationModel");

    // 🔒 ENFORCE CLOSED STATUS
    const convo = await Conversation.findById(payload.conversationId);
    if (!convo || convo.status === "CLOSED") return;

    const savedMsg = await Message.create(payload);

    io.to(payload.conversationId).emit("new-message", savedMsg);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// 🔑 Start DB + Server
const port = process.env.PORT || 4000;

mongoose
  .connect(process.env.DBURL)
  .then(() => {
    server.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
    console.log("DB connection successful");
  })
  .catch((err) => console.log("Error in DB connection", err));
