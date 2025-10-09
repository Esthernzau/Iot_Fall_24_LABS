const rpio = require('rpio');

// Initialize GPIO with BCM numbering
rpio.init({
  gpiomem: true,
  mapping: 'gpio'
});

// Pin Configuration 
const A = { GREEN: 4, AMBER: 17, RED: 27 };   // Group A
const B = { GREEN: 26, AMBER: 19, RED: 13 };  // Group B

// Setup pins as OUTPUT and initialize LOW
const pins = [A.GREEN, A.AMBER, A.RED, B.GREEN, B.AMBER, B.RED];
pins.forEach(p => rpio.open(p, rpio.OUTPUT, rpio.LOW));

// Helper Functions 
function setLights(group, green, amber, red) {
  rpio.write(group.GREEN, green ? rpio.HIGH : rpio.LOW);
  rpio.write(group.AMBER, amber ? rpio.HIGH : rpio.LOW);
  rpio.write(group.RED, red ? rpio.HIGH : rpio.LOW);
}
// Turn all amber lights on or off
function allAmber(on) {
  rpio.write(A.AMBER, on ? rpio.HIGH : rpio.LOW);
  rpio.write(B.AMBER, on ? rpio.HIGH : rpio.LOW);
}

// Traffic Cycle 
let state = 0;
console.log('🚦 Traffic lights started');

// 0: A Green, B Red
// 1: Both Amber
// 2: A Red, B Green
// 3: Both Amber
const interval = setInterval(() => {
  switch (state) {
    case 0:
      console.log('A: GREEN | B: RED');
      setLights(A, 1, 0, 0);
      setLights(B, 0, 0, 1);
      break;
    
    case 1:
      console.log('BOTH: AMBER WARNING');
      setLights(A, 0, 1, 0);
      setLights(B, 0, 1, 0);
      break;

    case 2:
      console.log('A: RED | B: GREEN');
      setLights(A, 0, 0, 1);
      setLights(B, 1, 0, 0);
      break;

    case 3:
      console.log('BOTH: AMBER WARNING');
      setLights(A, 0, 1, 0);
      setLights(B, 0, 1, 0);
      break;
  }
// Move to next state
  state = (state + 1) % 4; // Loop 0→3
}, 4000); // 4 seconds per state

// Graceful Shutdown 
process.on('SIGINT', () => {
  clearInterval(interval);
  pins.forEach(p => {
    rpio.write(p, rpio.LOW);
    rpio.close(p);
  });
  console.log('\n Clean exit — all lights off');
  process.exit(0);
});
