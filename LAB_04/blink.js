const rpio = require('rpio');

// Initialize with physical pin numbering
rpio.init({
    gpiomem: true,
    mapping: 'physical'
});

// Use PHYSICAL pin 7 (GPIO4)
const ledPin = 7;

rpio.open(ledPin, rpio.OUTPUT, rpio.LOW);

console.log('Blink started on physical pin 7 (GPIO4)');

let value = 0;
const interval = setInterval(() => {
    value = value ? rpio.LOW : rpio.HIGH;
    rpio.write(ledPin, value);
    console.log(`LED state: ${value ? 'ON' : 'OFF'}`);
}, 2000);

process.on('SIGINT', () => {
    clearInterval(interval);
    rpio.write(ledPin, rpio.LOW);
    rpio.close(ledPin);
    console.log('Clean exit');
    process.exit(0);
});