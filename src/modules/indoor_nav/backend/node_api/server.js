import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors({ origin: ["http://localhost:3000"], methods: ["GET", "POST"], allowedHeaders: ["Content-Type"] }));

const PY_API_URL = "http://127.0.0.1:8001";

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Node.js bridge running" });
});

app.post("/api/predict", async (req, res) => {
  try {
    const response = await axios.post(`${PY_API_URL}/predict`, req.body);
    res.json(response.data);
  } catch (err) {
    console.error("Error contacting Python API:", err.message);
    res.status(500).json({ error: "Python API unreachable", detail: err.message });
  }
});

app.listen(8002, () => {
  console.log("✅ Node API bridge running on http://localhost:8002");
});
