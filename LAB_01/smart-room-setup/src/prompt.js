/*
This module sets up and exports a prompt function for synchronous user input.
It uses the 'prompt-sync' package to create a prompt that can handle SIGINT (Ctrl+C) without crashing the program
*/

import createPrompt from "prompt-sync"; 
const prompt = createPrompt({ sigint: true }); 
export default prompt;
