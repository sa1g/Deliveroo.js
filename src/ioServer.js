const { Server } = require('socket.io');
const httpServer = require('./httpServer');
const myGrid = require('./grid');
const Authentication = require('./deliveroo/Authentication');
const {BROADCAST_LOGS} = require('../config');
const myClock = require('./deliveroo/Clock');
require('events').EventEmitter.defaultMaxListeners = 200; // default is only 10! (https://nodejs.org/api/events.html#eventsdefaultmaxlisteners)



const myAuthenticator = new Authentication( myGrid )

const io = new Server( httpServer, {
    cors: {
        origin: "*", // http://localhost:3000",
        credentials: false, // https://socket.io/docs/v4/handling-cors/#credential-is-not-supported-if-the-cors-header-access-control-allow-origin-is-
        allowedHeaders: ["x-token"]
    }
} );



io.on('connection', (socket) => {
    


    /**
     * Authenticate socket on agent
     */
    const me = myAuthenticator.authenticate(socket);
    if ( !me ) return;
    socket.broadcast.emit( 'hi ', socket.id, me.id, me.name );



    /**
     * Config
     */
    if ( me.name == 'god' ) { // 'god' mod
        me.config.PARCELS_OBSERVATION_DISTANCE = 'infinite'
        me.config.AGENTS_OBSERVATION_DISTANCE = 'infinite'
    }
    socket.emit( 'config', me.config )

    

    /**
     * Emit map (tiles)
     */
    myGrid.on( 'tile', ({x, y, delivery, blocked, parcelSpawner}) => {
        // console.log( 'emit tile', x, y, delivery, parcelSpawner );
        if (!blocked)
            socket.emit( 'tile', x, y, delivery, parcelSpawner );
        else
            socket.emit( 'not_tile', x, y );
    } );
    let tiles = []
    for (const {x, y, delivery, blocked, parcelSpawner} of myGrid.getTiles()) {
        if ( !blocked ) {
            socket.emit( 'tile', x, y, delivery, parcelSpawner )
            tiles.push( {x, y, delivery, parcelSpawner} )
        } else
            socket.emit( 'not_tile', x, y );
    }
    let {width, height} = myGrid.getMapSize()
    socket.emit( 'map', width, height, tiles )
    

    
    /**
     * Emit me
     */

    // Emit you
    me.on( 'agent', ({id, name, x, y, score}) => {
        // console.log( 'emit you', id, name, x, y, score );
        socket.emit( 'you', {id, name, x, y, score} );
    } );
    // console.log( 'emit you', id, name, x, y, score );
    socket.emit( 'you', {id, name, x, y, score} = me );
    


    /**
     * Emit sensing
     */

    // Parcels
    me.on( 'parcels sensing', (parcels) => {
        // console.log('emit parcels sensing', ...parcels);
        socket.emit('parcels sensing', parcels )
    } );
    me.emitParcelSensing();

    // Agents
    me.on( 'agents sensing', (agents) => {
        // console.log('emit agents sensing', ...agents); // {id, name, x, y, score}
        socket.emit( 'agents sensing', agents );
    } );
    me.emitAgentSensing();
    


    /**
     * Actions
     */
    
    socket.on('move', async (direction, acknowledgementCallback) => {
        // console.log(me.id, me.x, me.y, direction);
        try {
            const moving = me[direction]();
            if ( acknowledgementCallback )
                acknowledgementCallback( await moving ); //.bind(me)()
        } catch (error) { console.error(direction, 'is not a method of agent'); console.error(error) }
    });

    socket.on('pickup', async (acknowledgementCallback) => {
        const picked = await me.pickUp()
        if ( acknowledgementCallback )
            try {
                acknowledgementCallback( picked )
            } catch (error) { console.error(error) }
    });

    socket.on('putdown', async (selected, acknowledgementCallback) => {
        const dropped = await me.putDown( selected )
        if ( acknowledgementCallback )
            try {
                acknowledgementCallback( dropped )
            } catch (error) { console.error(error) }
    });



    /**
     * Communication
     */

    socket.on( 'say', (toId, msg, acknowledgementCallback) => {
        
        // console.log( me.id, me.name, 'say ', toId, msg );

        for ( let socket of myAuthenticator.getSockets( toId )() ) {
            
            // console.log( me.id, me.name, 'emit \'msg\' on socket', socket.id, msg );
            socket.emit( 'msg', me.id, me.name, msg );

        }

        try {
            if (acknowledgementCallback) acknowledgementCallback( 'successful' )
        } catch (error) { console.log( me.id, 'acknowledgement of \'say\' not possible' ) }

    } )

    socket.on( 'ask', (toId, msg, replyCallback) => {
        // console.log( me.id, me.name, 'ask', toId, msg );

        for ( let socket of myAuthenticator.getSockets( toId )() ) {
            
            // console.log( me.id, 'socket', socket.id, 'emit msg', ...args );
            socket.emit( 'msg', me.id, me.name, msg, (reply) => {

                try {
                    console.log( toId, 'replied', reply );
                    replyCallback( reply )
                } catch (error) { console.log( me.id, 'error while trying to acknowledge reply' ) }

            } );

        }

    } )

    socket.on( 'shout', (msg, acknowledgementCallback) => {

        // console.log( me.id, me.name, 'shout', msg );

        socket.broadcast.emit( 'msg', me.id, me.name, msg );

        try {
            if (acknowledgementCallback) acknowledgementCallback( 'successful' )
        } catch (error) { console.log( me.id, 'acknowledgement of \'shout\' not possible' ) }
        
    } )


    
    /**
     * Path
     */
    
    socket.on( 'path', ( path ) => {
        
        for ( let s of myAuthenticator.getSockets( me.id )() ) {

            if ( s == socket )
                continue;
            
            s.emit( 'path', path );

        }

    } )


    
    /**
     * Bradcast client log
     */
    if ( BROADCAST_LOGS ) {
        socket.on( 'log', ( ...message ) => {
            socket.broadcast.emit( 'log', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, ...message )
        } )
    }



    /**
     * GOD mod
     */
    if ( me.name == 'god' ) {

        socket.on( 'create parcel', async (x, y) => {
            console.log( 'create parcel', x, y )
            myGrid.createParcel(x, y)
        } );

        socket.on( 'dispose parcel', async (x, y) => {
            console.log( 'dispose parcel', x, y )
            let parcels = Array.from(myGrid.getParcels()).filter( p => p.x == x && p.y == y );
            for ( p of parcels)
                myGrid.deleteParcel( p.id )
            myGrid.emit( 'parcel' );
        } );

        socket.on( 'tile', async (x, y) => {
            console.log( 'create/dispose tile', x, y )
            let tile = myGrid.getTile(x, y)
            
            if ( !tile ) return;

            if ( tile.blocked ) {
                tile.delivery = false;
                tile.parcelSpawner = true;
                tile.unblock();
            } else if ( tile.parcelSpawner ) {
                tile.delivery = true;
                tile.parcelSpawner = false;
            } else if ( tile.delivery ) {
                tile.delivery = false;
                tile.parcelSpawner = false;
            } else {
                tile.delivery = false;
                tile.parcelSpawner = false;
                tile.block();
            }
        } );

    }

    socket.on( 'draw', async (bufferPng) => {
        // console.log( 'draw' );
        for ( let s of myAuthenticator.getSockets( me.id )() ) {
            if ( s == socket )
                continue;
            s.emit( 'draw', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, bufferPng );
        }
        // socket.broadcast.emit( 'draw', {src: 'client', timestamp: myClock.ms, socket: socket.id, id: me.id, name: me.name}, bufferPng );
    } );

});



/**
 * Bradcast server log
 */
if ( BROADCAST_LOGS ) {
    const oldLog = console.log;
    console.log = function ( ...message ) {
        io.emit( 'log', {src: 'server', timestamp: myClock.ms}, ...message );
        oldLog.apply( console, message );
    };
}



module.exports = io;