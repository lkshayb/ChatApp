"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const ws_1 = require("ws");
const db_1 = __importDefault(require("./db/db"));
const room_1 = __importDefault(require("./db/room"));
const message_1 = __importDefault(require("./db/message"));
const PORT = Number(process.env.PORT) || 8080;
const server = (0, http_1.createServer)();
const wss = new ws_1.WebSocketServer({ server });
let allSockets = [];
var CurrentRooms = [];
//aaaa
function connect_DB() {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, db_1.default)();
    });
}
(0, db_1.default)();
function HandleRoomAddition(rm) {
    return __awaiter(this, void 0, void 0, function* () {
        const msg = yield room_1.default.find({ roomId: rm });
        console.log(msg);
        if (msg.length != 0) {
            return;
        }
        else {
            yield room_1.default.create({
                roomId: rm,
                users: []
            });
        }
    });
}
function AddUserToRoom(name, socket) {
    return __awaiter(this, void 0, void 0, function* () {
        yield room_1.default.updateOne({ roomId: 1 }, {
            $push: {
                users: {
                    username: name,
                    socket: socket
                }
            }
        });
    });
}
wss.on("connection", (socket) => {
    setInterval(() => {
        socket.send(JSON.stringify({
            type: "roomdata",
            rcount: CurrentRooms.length
        }));
    }, 1000);
    socket.on("close", () => {
        let remroom;
        console.log("1 connection closed");
        for (let i = 0; i < allSockets.length; i++) {
            if (allSockets[i].socket === socket) {
                remroom = allSockets[i].room;
                console.log("removed socket from :", remroom);
                allSockets.splice(i, 1);
                break;
            }
        }
        if (remroom !== undefined) {
            const stillexist = allSockets.some(e => e.room === remroom);
            if (!stillexist) {
                const roomIndex = CurrentRooms.indexOf(remroom);
                if (remroom !== -1) {
                    console.log("rem room :", remroom);
                    CurrentRooms.splice(roomIndex, 1);
                }
                else {
                    console.log("room not found:", remroom);
                }
            }
            else {
                console.log("room stil have sockets");
            }
        }
    });
    socket.on("message", (message) => __awaiter(void 0, void 0, void 0, function* () {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type == "join") {
            setInterval(() => {
                const usersInRoom = allSockets
                    .filter(user => user.room === parsedMessage.payload.roomID)
                    .map(user => user.name);
                let rmcount = 0;
                for (let i = 0; i < allSockets.length; i++) {
                    if (allSockets[i].room == parsedMessage.payload.roomID) {
                        rmcount++;
                        allSockets[i].socket.send((JSON.stringify({
                            type: "pplcount",
                            count: rmcount,
                            names: usersInRoom
                        })));
                    }
                }
            }, 1000);
            const rm = Number(parsedMessage.payload.roomID);
            if (CurrentRooms) {
                yield HandleRoomAddition(rm);
                let flag = 0;
                for (let i = 0; i < CurrentRooms.length; i++) {
                    if (CurrentRooms[i] == rm) {
                        flag = 1;
                    }
                }
                if (flag == 0) {
                    CurrentRooms.push(rm);
                }
            }
            console.log("Looking for users in room:", parsedMessage.payload.roomID);
            allSockets.push({
                socket,
                room: parsedMessage.payload.roomID,
                name: parsedMessage.payload.name
            });
            yield AddUserToRoom(parsedMessage.payload.name, socket);
        }
        if (parsedMessage.type == "chat") {
            const currentUser = allSockets.find(user => user.socket === socket);
            if (!currentUser) {
                socket.send(JSON.stringify({ msg: "ROOM NOT FOUND" }));
                return;
            }
            const currentUserRoom = currentUser === null || currentUser === void 0 ? void 0 : currentUser.room;
            yield message_1.default.create({
                roomId: currentUser.room,
                username: currentUser.name,
                message: parsedMessage.payload.msg
            });
            for (let i = 0; i < allSockets.length; i++) {
                if (allSockets[i].room == currentUserRoom) {
                    allSockets[i].socket.send((JSON.stringify({
                        msg: parsedMessage.payload.msg,
                        sender: parsedMessage.payload.sender,
                    })));
                }
            }
        }
    }));
});
server.listen(PORT, () => {
    console.log(`Server running at ws://localhost:${PORT}`);
});
