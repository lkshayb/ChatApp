import mongoose from "mongoose"

export default async function connectDB(){
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/chatapp")
        console.log("connected")
    }catch(e:any){
        console.log(e.message)
        process.exit(1)
    }
}