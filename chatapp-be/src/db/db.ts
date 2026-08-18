import mongoose from "mongoose"
import "dotenv/config";
const URI = String(process.env.MONGODB_URI) || "";
export default async function connectDB(){
    try{
        await mongoose.connect(URI)
        console.log("connected")
    }catch(e:any){
        console.log(e.message)
        process.exit(1)
    }
}