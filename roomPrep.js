class Rooms {
    constructor() {
        this.rooms = {}; // Initialize the rooms container
    }

    // Add a room by roomId
    addRoom(roomId) {
        if (!this.rooms[roomId]) {
            this.rooms[roomId] = {};
        }
    }
    addSocket(roomId,socketId){
        if (!this.rooms[roomId]) {
            this.addRoom(roomId); // Ensure the room exists
        }
        this.rooms[roomId][socketId] = { };
    }
    // Add a socket to a specific room
    addSocketToRoom(roomId,playerNumber, socketId, name, permission) {
        if (!this.rooms[roomId]) {
            this.addRoom(roomId); // Ensure the room exists
        }
        this.rooms[roomId][playerNumber] = { name, permission,socketId };
    }

    // Get all rooms
    getRooms() {
        return this.rooms;
    }

    // Get a specific room
    getRoom(roomId) {
        return this.rooms[roomId] || null;
    }

    // Get a specific socket in a room
    getSocket(roomId,playerNumber, socketId) {
        return this.rooms[roomId]?.[playerNumber] || null;
    }

    // Delete a specific socket from a room
    deleteSocket(roomId, playerNumber,socketId) {
        if (this.rooms[roomId]) {
            delete this.rooms[roomId][playerNumber];
        }
    }

    // Delete a room entirely
    deleteRoom(roomId) {
        delete this.rooms[roomId];
    }
}


// Usage example
export default new Rooms();

// // Adding rooms and sockets
// roomsManager.addRoom("room1");
// roomsManager.addSocketToRoom("room1", "socketId1", "pradeep", "admin");
// roomsManager.addSocketToRoom("room1", "socketId2", "sandeep", "member");

// roomsManager.addRoom("room2");
// roomsManager.addSocketToRoom("room2", "socketId1", "pradeep", "admin");
// roomsManager.addSocketToRoom("room2", "socketId2", "sandeep", "member");

// // Get all rooms
// console.log(roomsManager.getRooms());

// // Get specific room
// console.log(roomsManager.getRoom("room1"));

// // Get specific socket in a room
// console.log(roomsManager.getSocket("room1", "socketId1"));

// // Delete a socket
// roomsManager.deleteSocket("room1", "socketId2");
// console.log(roomsManager.getRoom("room1"));

// // Delete a room
// roomsManager.deleteRoom("room2");
// console.log(roomsManager.getRooms());
