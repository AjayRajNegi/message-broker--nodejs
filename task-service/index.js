import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import amqp from "amqplib";

const app = express();
const port = 3002;

app.use(bodyParser.json());

mongoose
  .connect(`mongodb://mongo:27017/tasks`)
  .then(() => console.log("Connected to mongoDB"))
  .catch((err) => console.log("MongoDB connection error:", err));

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Task = mongoose.model("Task", TaskSchema);

app.post("/tasks", async (req, res) => {
  const { title, description, userId } = req.body;

  try {
    const task = new Task({ title, description, userId });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    console.error("Error saving:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

let channel, connection;

async function connectionRabbitMQWithRetry(retries = 5, delay = 3000) {
  while (retries) {
    try {
      connection = await amqp.connect("amqp://rabbitmq_node");
      channel = await connection.createChannel();
      await channel.assertQueue("task_created");
      console.log("Connected to RabbitMQ");
      return;
    } catch (error) {
      console.error("RabbitMQ Connection Error:", error.message);
      retries--;
      console.log("Retrying again:", retries);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
}

app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();

  const message = { taskId: tasks._id, userId, title };

  if (!channel) {
    return res.status(503).json({ error: "RabbitMQ not connected." });
  }

  channel.sendToQueue("task_created", Buffer.from(JSON.stringify(message)));

  res.json(tasks);
});

app.listen(port, () => {
  console.log(`Task service listening on port ${port}`);
  connectionRabbitMQWithRetry();
});
