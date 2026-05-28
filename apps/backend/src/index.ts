import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

app.get("/", (req, res) => {
  res.send("Server running");
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", (data) => {
    console.log(data);

    io.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
