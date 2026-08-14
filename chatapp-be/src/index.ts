import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";


const PORT = Number(process.env.PORT) || 8080;
const server = createServer(); 
    
const wss = new WebSocketServer({ server  });

interface User {
    socket : WebSocket;
    room : number;
    name: string;
}

let allSockets: User[] = []
var CurrentRooms:number[] = [];

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

    socket.on("message", (message) => {
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

            const rm:number = Number(parsedMessage.payload.roomID);
            
            if(CurrentRooms){
                //Call Room Addition function in DB
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
            //Call function to add user in room in DB


           
        }

        if (parsedMessage.type == "chat"){
            // let currentUserRoom = null
            // for (let i = 0;i<allSockets.length;i++){
            //     if (allSockets[i].socket instanceof socket.constructor) {
            //         currentUserRoom = allSockets[i].room
            //     }
            // }
            const currentUser = allSockets.find(user => user.socket === socket);
            if(!currentUser){
                socket.send(JSON.stringify({msg:"ROOM NOT FOUND"}))
                return 
            }
            const currentUserRoom = currentUser?.room;
            // Code to add message in room schema of DB 
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

// Start both HTTP & WebSocket server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
