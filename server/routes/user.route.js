import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import dotenv from "dotenv";

import { UserModel } from "../db.js";

dotenv.config();

const userRouter = express.Router();

const userSchema = z.object({
  username: z.string().min(3).max(12),
  password: z.string().min(6),
});

userRouter.post("/signup", async (req, res) => {
  try {
    const parsed = userSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const { username, password } = parsed.data;

    const trimmedUsername = username.trim();

    const existingUser = await UserModel.findOne({ username: trimmedUsername });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await UserModel.create({
      username: trimmedUsername,
      password: hashedPassword,
    });

    res.status(201).json({ message: "You are signed up!" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

userRouter.post("/signin", async (req, res) => {
  try {
    const parsed = userSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Validation failed",
        error: parsed.error.errors[0].message,
      });
    }

    const { username, password } = parsed.data;

    const trimmedUsername = username.trim();

    const user = await UserModel.findOne({ username: trimmedUsername });

    if (!user) {
      return res.status(403).json({ message: "Incorrect credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(403).json({ message: "Incorrect credentials" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), username: user.username },
      process.env.JWT_SECRET_USER
    );

    res.json({ token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

export default userRouter;
