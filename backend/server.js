import express from "express"
import cors from 'cors'
import 'dotenv/config'
import { createServer } from "http"
import { Server } from "socket.io"
import connectDB from "./config/mongodb.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import meetingRouter from "./routes/meetingRoute.js"
import prescriptionRouter from "./routes/prescriptionRoute.js"
import notificationRouter from "./routes/notificationRoute.js"

// app config
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)
  
  // Join a room based on userId for targeted notifications
  socket.on("join", (userId) => {
    socket.join(userId)
    console.log(`User ${userId} joined their room`)
  })
  
  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
  })
})

// Make io accessible to the routes
app.set("io", io)

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/meeting", meetingRouter)
app.use("/api/prescription", prescriptionRouter)
app.use("/api/notifications", notificationRouter)

app.get("/", (req, res) => {
  res.send("API Working")
});

httpServer.listen(port, () => console.log(`Server started on PORT:${port}`))