import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import scoresRouter from "./routes/scores.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/scores", scoresRouter);

app.listen(process.env.PORT, () => {
    console.log("API corriendo en puerto", process.env.PORT);
});
