import { Socket } from "dgram";
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
    {
        roomId: {
            type:Number,
            required:true,
            unique:true
        },
        users: [{
            username:String,
            joinedAt : {
                type: Date,
                default : Date.now
            }
        }]
    },
    {
        timestamps : true
    }
)

export default mongoose.model("Room",roomSchema)