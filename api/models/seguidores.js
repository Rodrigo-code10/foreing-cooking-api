import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
  followerId: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"Usuario",
    required:true
  },
  followsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true
  },
  fecha: {
    type:Date,
    default:Date.now
  }
});

export const Follow = mongoose.model("Follow", followSchema);
