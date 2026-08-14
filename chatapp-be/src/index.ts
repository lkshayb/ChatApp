import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import connectDB from "./db/db";
import Room from "./db/room"
import Message from "./db/message"
const PORT = Number(process.env.PORT) || 8080;

const server = createServer();  
const wss = new WebSocketServer({ server  });

interface User {
    socket : WebSocket;
    room : number;
    name: string;
}

let allSockets: User[] = []
var CurrentRooms:Number[] = [];

//aaaa
async function connect_DB() {
    await connectDB()    
}

connectDB()

async function HandleRoomAddition(rm:any) {
    const msg = await Room.find({roomId:rm})
    console.log(msg)
    if(msg.length != 0){
        return
    }  
    else{
        await Room.create({
            roomId: rm,
            users:[]
        })
    }
}

async function AddUserToRoom(name:String,socket:any) {
    await Room.updateOne(
        { roomId: 1 },
        {
            $push: {
                users: {
                    username: name,
                    socket:socket
                }
            }
        }
    );
}

wss.on("connection",(socket) => {

    setInterval(() => {
        socket.send(JSON.stringify({
        type:"roomdata",
        rcount:CurrentRooms.length
    }))
    }, 1000);
    
    

    socket.on("close" , () => {
        
        let remroom:number | undefined;
        console.log("1 connection closed")

        for(let i=0;i<allSockets.length;i++){
            
            if(allSockets[i].socket === socket){
                remroom = allSockets[i].room
                console.log("removed socket from :",remroom)
                allSockets.splice(i,1)
                break
            }
        }
        if(remroom !== undefined){
            const stillexist = allSockets.some(e => e.room === remroom)
            
            if(!stillexist){
                const roomIndex = CurrentRooms.indexOf(remroom);
                if(remroom !== -1){
                    console.log("rem room :",remroom);
                    CurrentRooms.splice(roomIndex,1)
                }else{
                    console.log("room not found:",remroom);
                }
            } else{
                console.log("room stil have sockets")
            }
        }
        
    })

    socket.on("message",async (message) => {
        const parsedMessage = JSON.parse(message as unknown as string);
        
        

        if (parsedMessage.type == "join"){

            setInterval(() => {
                const usersInRoom = allSockets
                    .filter(user => user.room === parsedMessage.payload.roomID)
                    .map(user => user.name);
                let rmcount = 0;
                for(let i=0;i<allSockets.length;i++){
                    if(allSockets[i].room == parsedMessage.payload.roomID){
                        rmcount++
                        allSockets[i].socket.send((
                            JSON.stringify({
                                type:"pplcount",
                                count:rmcount,
                                names: usersInRoom
                            })
                        ))
                    }
                }
            }, 1000);

            const rm:Number = Number(parsedMessage.payload.roomID);
            
            if(CurrentRooms){
                
                await HandleRoomAddition(rm)
                let flag = 0;
                for(let i = 0;i<CurrentRooms.length;i++){
                    if(CurrentRooms[i] == rm){
                        flag = 1;
                    }  
                }
                if (flag == 0){
                        CurrentRooms.push(rm)
                }
            } 
            console.log("Looking for users in room:", parsedMessage.payload.roomID);

            

            
            
            allSockets.push({
                socket,
                room: parsedMessage.payload.roomID,
                name: parsedMessage.payload.name
            })
            await AddUserToRoom(parsedMessage.payload.name,socket)


           
        }

        if (parsedMessage.type == "chat"){
            const currentUser = allSockets.find(user => user.socket === socket);
            if(!currentUser){
                socket.send(JSON.stringify({msg:"ROOM NOT FOUND"}))
                return 
            }
            const currentUserRoom = currentUser?.room;
            await Message.create({
                roomId: currentUser.room,
                username: currentUser.name,
                message: parsedMessage.payload.msg
            });
            for (let i = 0;i< allSockets.length;i++){
                if (allSockets[i].room == currentUserRoom){ 
                    allSockets[i].socket.send((
                        JSON.stringify({
                            msg: parsedMessage.payload.msg,
                            sender: parsedMessage.payload.sender,

                        })
                    ))
                    
                
                }
            }
        }
    })

})


server.listen(PORT, () => {
    console.log(`Server running at ws://localhost:${PORT}`);
});
