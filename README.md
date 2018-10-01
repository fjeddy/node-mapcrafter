node-mapcrafter
============
node-mapcrafter is a small script designed to spawn, run and handle
a mapcrafter job from within node.

node-mapcrafter will spawn mapcrafter as a child process and send you
events on it's progress. node-mapcrafter will also let you start and stop the
mapcrafter process at your will.

## Getting Started

Getting up and running with node-mapcrafter is fairly simple, but some basic node skills along with a detailed understanding of how and you need this specific library will come in handy.

#### Prerequisites
- [NodeJS](https://nodejs.org/en/) (^8.0.0 recommended)

#### Setup
While inside the root of your node application directory, run `npm install node-mapcrafter`. You can then use something along the line of the following in your node app.

```javascript
const Mapcrafter = require( 'node-mapcrafter' );

const server = new Mapcrafter( {
  executable: 'mapcrafter', // Where mapcrafter is located for execution.
  config: 'macrafter.conf', // Mapcrafter config file as per mapcrafter docs
  processors: 2, // Amount of CPUs to use concurrently
  pipeIO: false, // Output to terminal
  args: [],
  spawnOpts: {
    stdio: ['pipe', 'pipe', 'inherit'],
  }
} );

server.start(); // Start Mapcrafter
```

#### Events
Events are sent whenever something occurs in the console. These events are parsed and specified. You can use these events to showcase the mapcrafter process.

```javascript
server.on( 'status', data => {
  console.log( data );
} );
```

Events will always send a JSON object.

#### Stop server
You can stop the mapcrafter process at any time by calling...

```javascript
server.stop(); // Stop Mapcrafter
```
