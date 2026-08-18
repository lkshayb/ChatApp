import mongoose from "mongoose"
import "dotenv/config"; 
const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.vnt6tgn.mongodb.net/mydb`;
export default async function connectDB(){
    try{
        await mongoose.connect(uri)
        console.log("connected")
    }catch(e:any){
        console.log(e.message)
        process.exit(1)
    }
}