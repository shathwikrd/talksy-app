import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, unique: true },
    password: { type: String },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("users", UserSchema);

export { UserModel };
