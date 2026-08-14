import mongoose from "mongoose"
const messageSchema = new mongoose.Schema(
  {
    roomId: {type: Number,required: true,index: true},
    username: {type: String,required: true},
    message: {type: String,required: true},
    type: {type: String,enum: ["text", "system"],default: "text"},
  },
  { timestamps: true }
);
export default mongoose.model("Message", messageSchema);