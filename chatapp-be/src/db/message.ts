import { time } from "console";
import mongoose from "mongoose"
const messageSchema = new mongoose.Schema(
  {
    roomId: {type: Number,required: true,index: true},
    sender: {type: String,required: true},
    text: {type: String,required: true},
    timestamp:{type:String,required:true,default: new Date().toLocaleTimeString()}
  },
  { timestamps: true }
);
export default mongoose.model("Message", messageSchema);