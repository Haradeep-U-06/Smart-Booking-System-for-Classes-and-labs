# Smart Booking System - Interview Study Guide

## 1. Project Pitch

This project is a MERN-style classroom and lab booking system for faculty and admins.

The main goal is to help teachers view available classrooms/labs, book free slots, cancel their own bookings, apply for leave, and discuss leave requests with the admin through real-time chat. Admins can manage classrooms, configure weekly timetables, review leave requests, approve/reject them, and close the related conversation.

Good 30-second answer:

> I built a smart classroom and lab booking system using React, Express, MongoDB, Mongoose, Clerk, Axios, and Socket.IO. The system maintains classroom timetables, detects slot conflicts, supports faculty bookings, handles leave applications, and gives admins tools to manage rooms and approve or reject leave requests. I also added real-time chat between faculty and admin for leave discussions, where the conversation gets locked once a leave request is approved or rejected.

## 2. Tech Stack

- Frontend: React, Vite, React Router, Bootstrap, Axios
- Authentication: Clerk on the frontend
- Backend: Node.js, Express
- Database: MongoDB with Mongoose models
- Real-time communication: Socket.IO
- State sharing: React Context plus localStorage

## 3. Architecture

Frontend entry:

- `client/src/main.jsx` defines routes using `createBrowserRouter`.
- `TeacherContexts.jsx` stores current teacher data.
- `Idcontexts.jsx` stores current faculty ID.
- Pages/components call backend APIs using Axios.

Backend entry:

- `server/server.js` creates the Express app, connects MongoDB, mounts API routes, creates an HTTP server, and initializes Socket.IO.
- API modules live in `server/APIs`.
- Mongoose schemas live in `server/models`.
- `server/sck.js` stores the initialized Socket.IO instance so routes like leave approval can emit socket events.

High-level flow:

1. User signs in and teacher data is stored in context/localStorage.
2. Frontend requests classrooms, bookings, leaves, or chat data through REST APIs.
3. Express route handlers validate requests and use Mongoose models to read/write MongoDB.
4. For chat, Socket.IO rooms are based on `conversationId`.
5. When admin approves or rejects leave, the backend updates leave status, locks the conversation, and emits a `conversation-closed` event.

## 4. Main Features To Explain

### Classroom Management

Files:

- `client/src/admin/ClassroomManagement.jsx`
- `server/APIs/classroomApi.js`
- `server/models/classroomModel.js`

Admin can:

- Add a classroom/lab with name, block, year, capacity, and type.
- Add timetable slots grouped by day.
- View all rooms.
- Delete a room only if it has no active bookings.

Data model:

- `Classroom` stores metadata like name, year, block, capacity, type.
- `timetable` is an array of days.
- Each day contains `slots` with start/end time, section, faculty, and subject.
- `canceledSlots` tracks scheduled classes that were cancelled for a particular date/time.

Important talking point:

> I modelled timetables as embedded arrays inside the classroom document because timetable slots belong directly to a classroom and are usually fetched together when checking availability.

### Booking System

Files:

- `client/src/components/Book.jsx`
- `server/APIs/bookingApi.js`
- `server/APIs/classroomApi.js`
- `server/models/bookingModel.js`

User flow:

1. Faculty selects a date.
2. Frontend calls `GET /classroom-api/available-slots/:date`.
3. Backend checks each classroom's timetable for that weekday.
4. Backend also checks existing bookings for that date.
5. It marks slots as `Available`, `Taken`, or `Canceled`.
6. Faculty books an available slot through `POST /booking-api/bookings`.

Conflict prevention:

- The backend converts times into minutes.
- It checks exact matches and overlapping ranges.
- A booking is rejected if it overlaps with a scheduled class or another booking.

Good answer:

> I did conflict detection on the server, not only the UI, because the backend is the source of truth. Even if two users try to book the same room around the same time, the API checks existing scheduled slots and bookings before saving.

### Leave Management

Files:

- `client/src/components/LeaveApplication.jsx`
- `client/src/admin/LeaveRequests.jsx`
- `server/APIs/leaveApi.js`
- `server/models/leaveModel.js`

Faculty can:

- Apply for leave with from date, to date, leave type, and reason.
- View leave status.

Backend rules:

- Required fields are validated.
- Overlapping leave applications by the same faculty are rejected.
- A maximum of 8 leave applications per day is enforced.
- New leave applications create a related conversation.

Admin can:

- View pending/all leave requests.
- Approve or reject leave.
- Approval/rejection updates leave status and locks the conversation.

### Real-Time Chat

Files:

- `client/src/admin/AdminChat.jsx`
- `client/src/components/Conversation.jsx`
- `server/APIs/chatApi.js`
- `server/server.js`
- `server/sck.js`
- `server/models/conversationModel.js`
- `server/models/messageModel.js`

How it works:

1. Leave application creates a `Conversation`.
2. Frontend fetches the conversation using leave ID.
3. User joins a Socket.IO room using `conversationId`.
4. Messages are emitted through `send-message`.
5. Backend saves the message and emits `new-message` to the room.
6. On approve/reject, backend emits `conversation-closed`.

Good answer:

> I used Socket.IO rooms so only users inside a specific leave conversation receive those messages. Messages are still stored in MongoDB, so refreshing the page loads message history through the REST API.

## 5. Database Models

### Teacher

Stores teacher name and unique email.

### TeacherId

Maps teacher email to institution/faculty ID.

### Classroom

Stores room details, weekly timetable, and cancelled scheduled slots.

### Booking

Stores faculty, room, date, start time, and end time for dynamic bookings.

### LeaveApplication

Stores faculty leave request, date range, leave type, reason, status, and admin message.

### Conversation

Connects a leave request with teacher/admin participants and has status `OPEN` or `LOCKED`.

### Message

Stores messages by conversation, sender ID, sender role, content, and timestamps. It has an index on `conversationId` and `createdAt` for efficient chat history loading.

## 6. Questions You Should Practice

### Basic

1. What problem does your project solve?
2. Who are the users of the system?
3. What are the main modules?
4. Why did you use React?
5. Why did you use MongoDB?
6. What is the role of Express in your project?

### Frontend

1. How are routes managed?
2. How do you share teacher data across components?
3. Why did you use Context API?
4. How does the booking page update when the date changes?
5. How do filters work on the booking screen?
6. How do you show loading, success, and error states?

### Backend

1. Explain your API structure.
2. How do you connect Express to MongoDB?
3. How do you prevent duplicate or overlapping bookings?
4. How is leave overlap checked?
5. How do you enforce the maximum leave limit?
6. Why are schemas useful in Mongoose?

### Real-Time

1. Why did you use Socket.IO?
2. What is a socket room?
3. How does a message reach the correct user?
4. Why do you still store chat messages in MongoDB?
5. What happens when a conversation is closed?

### Design/Tradeoffs

1. Why store timetable inside the classroom document?
2. How would you scale this project?
3. How would you improve security?
4. What race condition can happen during booking?
5. How would you add role-based access control?
6. What would you change if thousands of users used it?

## 7. Strong Answers To Common Questions

### How do you prevent booking conflicts?

The backend fetches the classroom, finds scheduled timetable slots for the selected weekday, adds existing bookings for that room/date, converts times into minutes, and rejects the booking if the requested interval overlaps an existing interval. This is important because frontend checks alone are not reliable.

### How does leave approval affect chat?

Each leave application has a related conversation. When the admin approves or rejects the leave, the backend updates the leave status and also changes the conversation status to `LOCKED`. Then it emits `conversation-closed` to the conversation room so both sides see that no more messages can be sent.

### Why did you use Socket.IO instead of polling?

Socket.IO gives real-time updates with lower latency and avoids repeatedly calling the server. It is a good fit for chat because messages should appear immediately.

### Why use MongoDB for this project?

The data is document-oriented: classrooms have nested timetables, leaves have date ranges and status, and conversations have related messages. MongoDB with Mongoose made it easy to model these as documents while still enforcing schema rules.

### How does the available slot API work?

For a selected date, the backend calculates the weekday, checks each classroom's weekly timetable, removes canceled scheduled slots, adds dynamic bookings for that date, and marks each possible time slot as available or taken.

## 8. Honest Improvement Points

Use these if an interviewer asks "What would you improve?"

- Add proper role-based access control so only admins can use admin APIs.
- Move hardcoded URLs like `http://localhost:4000` into environment variables.
- Remove duplicate `GET /available-slots/:date` backend route and keep one clean implementation.
- Add database-level constraints or transactions to reduce race conditions during simultaneous booking.
- Add indexes for frequent queries, such as `Booking(classroomId, date, startTime, endTime)`.
- Replace hardcoded admin ID in leave conversation creation with the logged-in admin's ID.
- Add automated tests for booking conflicts, leave overlap, and chat locking.
- Improve status naming consistency because conversation schema uses `LOCKED`, while some frontend code checks for `CLOSED`.

## 9. One-Minute Project Explanation

> My project is a Smart Booking System for classrooms and labs. It has a React frontend and an Express/MongoDB backend. Teachers can sign in, view available rooms by date, filter rooms by block/year/type/time, book available slots, cancel their own bookings, and apply for leave. Admins can manage classrooms and timetables, review leave requests, and approve or reject them. I used Mongoose schemas for teachers, classrooms, bookings, leave applications, conversations, and messages. For real-time leave discussions, I used Socket.IO rooms based on conversation IDs, and messages are stored in MongoDB so history is preserved. A key part of the project is server-side conflict detection: before saving a booking, the API checks scheduled timetable slots and existing bookings to prevent overlaps.

## 10. Study Plan

Day 1:

- Learn the project pitch.
- Draw the architecture: React -> Axios -> Express routes -> Mongoose -> MongoDB.
- Explain each main model.

Day 2:

- Practice booking flow end to end.
- Practice leave flow end to end.
- Practice chat flow end to end.

Day 3:

- Practice likely questions.
- Prepare improvement answers.
- Be ready to open code and explain `Book.jsx`, `classroomApi.js`, `bookingApi.js`, `leaveApi.js`, and `server.js`.

