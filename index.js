const EventsEmitter = require( 'events' );
const { spawn } = require( 'child_process' );
const defaultsDeep = require( 'lodash.defaultsdeep' );

const defaultConfig = {
  executable: 'mapcrafter',
  config: 'macrafter.conf',
  processors: 2,
  pipeIO: false,
  args: [],
  spawnOpts: {
    stdio: ['pipe', 'pipe', 'inherit'],
  }
};

class Mapcrafter extends EventsEmitter {

  constructor( config = {} ) {

    super();
    this.config = defaultsDeep( {}, config, defaultConfig );
    this.modules = [];
    this.map = '';
    this.rotation = '';


    this.hasStarted = false;
    this.hasRunning = false;
    this.hasRestart = false;
    this.hasStopped = true;

    this.on( 'console', ( l ) => {

      if( this.hasRunning == false ) {

        // Mark server as running
        this.hasRunning = true;

        // Emit that the server is running
        this.emit( 'status', {
          event: 'started',
          message: 'Mapcrafter has now started and is rendering the world.'
        } );

      }

      if( this.hasRunning == true && l.match( /\[INFO]\s\[default]\sFinished.....aaand\sit's\sgone!/i ) ) {
        this.stop();
      }

    } );

    process.on( 'exit', () => this.stop() );
    process.on( 'close', () => this.stop() );

  }

  start() {

    if( this.spawn ) {

      this.emit( 'status', {
        event: 'running',
        message: 'Mapcrafter is already running.'
      } );

      throw new Error( 'Mapcrafter is already running.' );

    }

    this.hasStopped = false;

    const args = this.config.args.concat( '-c', this.config.config, '-j', this.config.processors );

    this.spawn = spawn( this.config.executable, args, this.config.spawnOpts );

    if( this.config.pipeIO ) {
      this.spawn.stdout.pipe( process.stdout );
      process.stdin.pipe( this.spawn.stdin );
    }

    this.spawn.stdout.on( 'data', ( d ) => {
      d.toString().split( '\n' ).forEach(( l ) => {
        if( l ) {

          // Check if server just started and emit starting status
          if( this.hasStarted == false && this.hasStopped == false ) {

            this.hasStarted = true;
          }

          const map = l.match( /\[INFO]\s\[default]\s\[.+]\sRendering map\s.+\s\("(\w*)"\)/ );
          const rotation = l.match( /\[INFO]\s\[default]\s\[.+]\sRendering rotation\s(.+).../ );
          const tiles = l.match( /\[INFO]\s\[default]\s.+will\srender\s(\d+)\srender\stiles./ );
          const progress = l.match( /\[INFO]\s\[progress]\s(\d+)%\scomplete.\sProcessed\s(\d+)\/(\d+)\sitems\swith\saverage\s(.+)\/s.\sETA\s(.+)./ );

          if( map != null && map[1] ) {
            this.map = map[1];

            this.emit( 'status', {
              event: 'map',
              message: 'Mapcrafter started working on the map ' + map[1],
              map: map[1]
            } );
          }

          if( rotation != null && rotation[1] ) {
            this.rotation = rotation[1];

            this.emit( 'status', {
              event: 'rotation',
              message: 'Mapcrafter is progress on the rotation ' + rotation[1] + ' on the map ' + this.map,
              rotation: rotation[1],
              map: this.map
            } );
          }

          if( tiles != null && tiles[1] ) {
            this.emit( 'status', {
              event: 'tiles',
              message: 'Mapcrafter found ' + tiles[1] + ' tiles that it will now render.',
              tiles: tiles[1],
              rotation: this.rotation,
              map: this.map
            } );
          }

          if( progress != null && progress[1] && progress[2] && progress[3] && progress[4] ) {
            this.emit( 'status', {
              event: 'progress',
              message: 'Mapcrafter is progressing',
              process_percent: progress[1],
              processed: progress[2],
              total: progress[3],
              average: progress[4],
              rotation: this.rotation,
              map: this.map
            } );
          }

          // Emit to console
          this.emit( 'console', l );

        }
      } );
    } );

    return this;

  }

  stop() {

    if( this.spawn ) {

      this.spawn.kill();
      this.spawn = null;
      this.hasStopped = true;

    }

    this.emit( 'status', {
      event: 'stopped',
      message: 'Mapcrafter has now been stopped / completed.'
    } );

    this.hasStarted = false;
    this.hasRunning = false;

    if( this.hasRestart == true ) {

      this.hasRestart = false;

      return this.start();

    }

    return this;

  }

  isRunning() {

    if( this.hasRunning ) return true;
    return false;

  }

}

module.exports = Mapcrafter;
