import express from "express";
import mongoose from "mongoose";
import bodyParser from "body-parser";

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

app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.listen(port, () => {
  console.log(`Task service listening on port ${port}`);
});
