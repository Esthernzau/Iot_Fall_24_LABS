/*
This module manages the rooms, their lights, and temperatures.
It provides functions to add rooms, toggle lights, set temperatures,
display room statuses, and turn off all lights.
It uses a utility function (randomTemperature) to generate random temperatures for new rooms.
*/

// Import the randomTemperature function from utilities.js
import { randomTemperature } from "./utilities.js";


// Array to hold room objects
let rooms = []; 

// Function to add a new room with a random temperature
function addRoom(roomName) {
  const newRoom = {
    roomName: roomName.trim(),
    light: "Off",
    temperature: randomTemperature()
  };
  rooms.push(newRoom); 
  console.log(`${newRoom.roomName} has been added.`);
}

// Function to toggle the light status of a specified room
function toggleLight(roomName) {
  const room = rooms.find(r => r.roomName.toLowerCase() === roomName.toLowerCase());
  if (!room) return console.log(`Room "${roomName}" not found.`);
  room.light = room.light === "On" ? "Off" : "On";
  console.log(`${room.roomName} light is now ${room.light}`);
}



// Function to set a new temperature for a specified room
function setTemperature(roomName, newTemp) {
  const room = rooms.find(r => r.roomName.toLowerCase() === roomName.toLowerCase());
  if (!room) return console.log(`Room "${roomName}" not found.`);

  const tempNum = Number(newTemp);
  if (Number.isNaN(tempNum)) return console.log("Temperature must be a number.");
  if (tempNum < 10 || tempNum > 35) return console.log("Temperature must be between 10°C and 35°C.");

  room.temperature = tempNum;
  console.log(`${room.roomName} temperature is now ${tempNum}°C`);
}



// Function to display the status of all rooms
function displayRooms() {
  if (rooms.length === 0) return console.log("No rooms added yet.");
  rooms.forEach(r => {
    console.log(`Room: ${r.roomName}, Light: ${r.light}, Temperature: ${r.temperature}°C`);
  });
}


// Function to turn off all lights in all rooms
function turnOffAllLights() {
  rooms.forEach(r => (r.light = "Off"));
  console.log("All lights have been turned off.");
}


// Export functions for use in other modules
export { addRoom, toggleLight, setTemperature, displayRooms, turnOffAllLights };
