const { Server } = require("socket.io");
const io = new Server(8000, { cors: true });

class Rooms {
    constructor() {
        this.rooms = {}; 
    }

   
    addRoom(roomId) {
        if (!this.rooms[roomId]) {
            this.rooms[roomId] = {};
        }
    }

   
    addSocketToRoom(roomId, socketId, name, permission) {
        if (!this.rooms[roomId]) {
            this.addRoom(roomId); 
        }
        this.rooms[roomId][socketId] = { name, permission };
    }

    
    getRooms() {
        return this.rooms;
    }

    
    getRoom(roomId) {
        return this.rooms[roomId] || null;
    }

    
    getSocket(roomId, socketId) {
        return this.rooms[roomId]?.[socketId] || null;
    }

    
    deleteSocket(roomId, socketId) {
        if (this.rooms[roomId]) {
            delete this.rooms[roomId][socketId];
        }
    }

    
    deleteRoom(roomId) {
        delete this.rooms[roomId];
    }
}

class roomIDGenerator {
    constructor() {
        this.queue = [];
        this.roomIDSet = new Set();
    }

    generateRandomroomID() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    generateroomID() {
        let roomID;
        do {
            roomID = this.generateRandomroomID();
        } while (this.roomIDSet.has(roomID));

        this.roomIDSet.add(roomID);
        this.queue.push({ roomID, createdAt: Date.now() });

        return roomID;
    }

    removeroomID(roomID) {
        this.roomIDSet.delete(roomID);
        this.queue = this.queue.filter((item) => item.roomID !== roomID);
        console.log(`roomID ${roomID} expired and removed`);
    }

    displayQueue() {
        console.log("Current roomID Queue:", this.queue);
    }
}

const roles = ["Mafia", "Doctor", "Detective", "Villager1", "Villager2", "Villager3"];

function assignRole(room) {
  if (!room) {
      console.error("assignRole: Room is undefined or null.");
      return null;
  }
  const assignedRoles = Object.values(room).map((player) => player.role || null);
  const availableRoles = roles.filter((role) => !assignedRoles.includes(role));
  return availableRoles[Math.floor(Math.random() * availableRoles.length)];
}




const roomsManager = new Rooms();
const roomGen = new roomIDGenerator();

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("create:room", (data) => {
      const roomID = roomGen.generateroomID();
      roomsManager.addRoom(roomID);
  
      // Verify the room exists after creation
      console.log(`Room ${roomID} created:`, roomsManager.getRoom(roomID));
  
      // Add the creator as the admin of the room
      roomsManager.addSocketToRoom(roomID, socket.id, data.name, "admin");
  
      socket.join(roomID);
  
      data.roomID = roomID;
      data.socketID = socket.id;
      const room = roomsManager.getRoom(roomID);
      const role = assignRole(room);
  
      if (!role) {
          socket.emit("join:room", { success: false, message: "No roles available." });
          return;
      }
      io.sockets.in(roomID).emit("create:room", {
          ...data,
          message: `Room ${roomID} created successfully. Waiting for players.`,
          success: true,
      });
  
      console.log(`Room created: ${roomID}`);
      console.log(roomsManager.getRooms());
  });
  

  socket.on("join:room", (data) => {
    const room = roomsManager.getRoom(data.roomId);

    if (!room) {
        
        console.error(`Room ${data.roomId} does not exist.`);
        socket.emit("join:room", { success: false, message: "Room does not exist." });
        return;
    }

    if (Object.keys(room).length >= 6) {
       
        socket.emit("join:room", { success: false, message: "Room is full." });
        return;
    }

    const role = assignRole(room);
    if (!role) {
        socket.emit("join:room", { success: false, message: "No roles available." });
        return;
    }

    // Assign roles
    socket.join(data.roomId);
    roomsManager.addSocketToRoom(data.roomId, socket.id, data.name, "member");
    roomsManager.rooms[data.roomId][socket.id].role = role;
    // io.to(socket.id).emit("join:room",{...data,
    //     socketID: socket.id,
    //     role,
    //     success: true,})
    io.to(data.roomId).emit("join:room", {
        ...data,
        socketID: socket.id,
        role,
        success: true,
    });

    console.log(`Socket ${socket.id} joined room ${data.roomId} as ${role}`);
    console.log(roomsManager.getRooms());
    if (Object.keys(room).length === 6) {
        
        const players = Object.entries(room).map(([socketId, playerData]) => ({
            socketId,
            name: playerData.name,
            permission: playerData.permission,
        }));

        io.to(data.roomId).emit("room:ready", {
            message: "Room is now full. Game is ready to start!",
            players,
        });

        console.log(`Room ${data.roomId} is full. Players:`, players);
    }
});

  

    socket.on("chat:outgoing", (data) => {
        io.to(data.roomId).emit("chat:incoming", data);
    });

    socket.on("connect:check", ({ roomId, name }) => {
        socket.join(roomId);
    });










    //Voice Chat Logic

    socket.on("signal:send", (data) => {
      io.to(data.target).emit("signal:receive", {
          signal: data.signal,
          sender: socket.id,
      });
  });

  socket.on("voice:join", (roomId) => {
      socket.join(roomId);
      const room = roomsManager.getRoom(roomId);
      if (room) {
          socket.emit("voice:users", Object.keys(room));
          room[socket.id] = {}; // Track this user in the room
          console.log(`Socket ${socket.id} joined voice room ${roomId}`);
      }
  });

  socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
      Object.keys(roomsManager.getRooms()).forEach((roomId) => {
          if (roomsManager.getSocket(roomId, socket.id)) {
              roomsManager.deleteSocket(roomId, socket.id);
              io.to(roomId).emit("voice:disconnect", socket.id);
          }
      });
  });




});

























// const MAX_PLAYERS = 6;
// let players = {};

// io.on('connection', (socket) => {
//     console.log('New user connected:', socket.id);

//     // Add player to the lobby if there's space
    
//         players[socket.id] = { /* You can add player data here */ };
//         socket.emit('joined', { id: socket.id, players });

//         // Notify other players about the new join
//         socket.broadcast.emit('user-connected', socket.id);
    

//     socket.on('offer', (data) => {
//         socket.to(data.target).emit('offer', {
//             sdp: data.sdp,
//             sender: socket.id
//         });
//     });

//     socket.on('answer', (data) => {
//         socket.to(data.target).emit('answer', {
//             sdp: data.sdp,
//             sender: socket.id
//         });
//     });

//     socket.on('ice-candidate', (data) => {
//         socket.to(data.target).emit('ice-candidate', {
//             candidate: data.candidate,
//             sender: socket.id
//         });
//     });

//     socket.on('disconnect', () => {
//         console.log('User disconnected:', socket.id);
//         delete players[socket.id];
//         socket.broadcast.emit('user-disconnected', socket.id);
//     });
// });