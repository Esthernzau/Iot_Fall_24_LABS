/*
This is the main entry point for the smart room setup assistant.
Interactive prompts guide the user through various room management tasks.
It leverages functions from rooms.js to perform operations like adding rooms,
toggling lights, setting temperatures, and displaying room statuses.
The assistant runs in a loop until the user chooses to exit.
prompt.js is used for capturing user input.
*/

// Import necessary modules and functions
import prompt from "./prompt.js";
import {
  addRoom,
  toggleLight,
  setTemperature,
  displayRooms,
  turnOffAllLights
} from "./rooms.js"; 

//display menu options
function mainMenu() {
  console.log(`
Smart Room Setup Assistant
1. Add Room
2. Toggle Light
3. Set Temperature
4. Display Rooms
5. Turn Off All Lights
6. Exit
  `); 

  // Get user choice
  const choice = prompt("Enter your choice: ").trim();

  switch (choice) {
    case "1":
      addRoom(prompt("Enter room name: "));
      break;
    case "2":
      toggleLight(prompt("Enter room name to toggle light: "));
      break;
    case "3":
      setTemperature(prompt("Enter room name: "), prompt("Enter new temperature: "));
      break;
    case "4":
      displayRooms();
      break;
    case "5":
      turnOffAllLights();
      break;
    case "6":
      console.log("Exiting Smart Room Setup Assistant...");
      return false;
    default:
      console.log("Invalid choice. Please try again.");
  }
  console.log("--------------------------------------------------------");
  return true;
} 

// Main loop to run the assistant
(function run() {
  let running = true;
  while (running) {
    running = mainMenu();
  }
})(); 
