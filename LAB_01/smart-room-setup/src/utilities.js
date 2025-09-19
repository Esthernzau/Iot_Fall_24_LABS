/*
This module provides utility functions for generating random integers and temperatures.
The randomTemperature function generates a random temperature between 18 and 26 degrees Celsius).
*/


function randomIntInclusive(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomTemperature() {
  return randomIntInclusive(18, 26);
}

export { randomIntInclusive, randomTemperature };
