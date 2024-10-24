import { default as io } from 'socket.io-client';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { default as EventEmitter } from 'events';


const scene = new THREE.Scene();

// const camera = new THREE.OrthographicCamera( -100, 100, 10, -10, 1, 100 );
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 300 );
camera.position.set(-1, 2, +2);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize( window.innerWidth, window.innerHeight );
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
document.body.appendChild( labelRenderer.domElement );

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize( window.innerWidth, window.innerHeight );
} );

const controls = new OrbitControls( camera, labelRenderer.domElement );
controls.minDistance = 10;
controls.maxDistance = 100;
controls.maxAzimuthAngle = Math.PI/10;
controls.minAzimuthAngle = -Math.PI/6;
controls.maxPolarAngle = Math.PI/2.2;
controls.minPolarAngle = 0;
controls.listenToKeyEvents( window );
controls.screenSpacePanning = false;
controls.target.set(0, 0, 0);
controls.update();

var enable_tile_mod = false;
window.addEventListener( 'keydown', (event) => {
    enable_tile_mod = ( event.keyCode === 16 ) ? true : false; // 12 is SHIFT
} );
window.addEventListener( 'keyup', (event) => {
    enable_tile_mod = false;
} );

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const clickables = new Array();
// const drag_controls = new DragControls( clickables, camera, labelRenderer.domElement );
// drag_controls.addEventListener( 'hoveron', (event) => hovered = event.object );
// drag_controls.addEventListener( 'hoveroff', (event) => hovered = null );
// https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_drag.html
labelRenderer.domElement.addEventListener( 'click', ( event ) => {
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    const intersections = raycaster.intersectObjects( clickables, true );
    if ( intersections.length > 0 ) {
        let hovered = intersections[ 0 ].object;
        let x = Math.round( hovered.position.x / 1.5 )
        let y = Math.round( - hovered.position.z / 1.5 )
        if ( enable_tile_mod ) {
            console.log( 'tile', x, y );
            socket.emit( 'tile', x, y );
        } else {
            if ( Array.from(parcels.values()).find( p => p.x == x && p.y == y ) ) {
                console.log( 'dispose parcel', x, y );
                socket.emit( 'dispose parcel', x, y );
            } else {
                console.log( 'create parcel', x, y );
                socket.emit( 'create parcel', x, y );
            }
        }
    }
} );

// for (var x=0; x<10; x++) {
//     for (var y=0; y<10; y++) {
//         addTile(x, y);
//     }
// }

const camTarget = new THREE.Vector3(0,0,0);

const animator = new EventEmitter();
animator.setMaxListeners(1000);

function animate() {
    
    //me.position.lerp( new Vector3().set(me.x-2, 10, -me.y+10), 0.1 );
    animator.emit( 'animate' );

    // Lerp move cameraTarget toward agent and apply camera offset 
    let diff = new THREE.Vector3().copy( camTarget ).sub( camTarget.lerp( me.mesh.position, 0.08 ) );
    camera.position.sub( diff );
    controls.target.sub( diff );

	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();

    renderer.render( scene, camera );
    labelRenderer.render( scene, camera );

    requestAnimationFrame( animate );
}



function createPanel() {

    const panel = new GUI( { width: 310 } );
    
    const tokenFolder = panel.addFolder( 'Tokens' );
    tokenFolder.close();

    const chatFolder = panel.addFolder( 'Chat' );
    chatFolder.open();

    function processMsg (id, name, msg) {
        let line = {}; line[id+' '+name] = JSON.stringify(msg)
        chatFolder.add( line, id+' '+name );
    }

    const leaderboardFolder = panel.addFolder( 'Leaderboard' );
    leaderboardFolder.open();
    
    const players = {}
    function updateLeaderboard ( agent ) {

        if ( ! Object.hasOwnProperty.call( players, agent.name ) ) {
            let player = {}; player[ agent.name ] = agent.score;
            let controller = leaderboardFolder.add( player, agent.name, 0, 1000 );
            players [ agent.name ] = controller;
        }
        players[ agent.name ].setValue( agent.score );

    }

    return { updateLeaderboard, processMsg }

}
const { updateLeaderboard, processMsg } = createPanel();

// const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
// const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
// const my_mesh = new THREE.Mesh( geometry, material );
// my_mesh.position.x = 1 * 1.5;
// my_mesh.position.y = 0.5;
// my_mesh.position.z = 1 * 1.5;
// // my_mesh.rotation.x = 90;
// scene.add( my_mesh );



/**
 * Grid axes
 */
{
    const dir = new THREE.Vector3( 1, 0, 0 ).normalize(); //normalize the direction vector (convert to vector of length 1)
    const origin = new THREE.Vector3( -1, 0, 1 );
    const length = 1;
    const hex = 0xffff00;
    const headLength = 0.2; // The length of the head of the arrow. Default is 0.2 * length.
    const headWidth = 0.2; // The width of the head of the arrow. Default is 0.2 * headLength.

    const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex, headLength, headWidth );
    scene.add( arrowHelper );
}
{
    const dir = new THREE.Vector3( 0, 0, -1 ).normalize(); //normalize the direction vector (convert to vector of length 1)
    const origin = new THREE.Vector3( -1, 0, 1 );
    const length = 1;
    const hex = 0xffff00;
    const headLength = 0.2; // The length of the head of the arrow. Default is 0.2 * length.
    const headWidth = 0.2; // The width of the head of the arrow. Default is 0.2 * headLength.

    const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex, headLength, headWidth );
    scene.add( arrowHelper );
}



class onGrid {
    
    #mesh
    /** @return {THREE.Mesh} */
    get mesh () {
        return this.#mesh;
    }

    #x
    get x () {
        return this.#x
    }
    set x (x) {
        this.#x = x
        // this.#mesh.position.x = x * 1.5
    }

    #y
    get y () {
        return this.#y
    }
    set y (y) {
        this.#y = y
        // this.#mesh.position.z = -y * 1.5
    }

    #carriedBy
    pickup ( agent ) {
        this.#carriedBy = agent;
        this.#carriedBy.#mesh.add( this.#mesh );
        this.#carriedBy.carrying.set(this.id, this);
        scene.remove( this.#mesh );
        this.x = 0;
        this.y = 0;
        this.#mesh.position.x = 0;
        this.#mesh.position.z = 0;
        this.#mesh.position.y = this.#carriedBy.carrying.size * 0.5;
    }
    putdown ( x, y ) {
        this.#carriedBy.#mesh.remove( this.#mesh );
        this.#carriedBy.carrying.delete(this.id);
        this.opacity = 1;
        this.x = x // this.#agent.x;
        this.y = y // this.#agent.y;
        this.#mesh.position.x = this.#carriedBy.#mesh.position.x;
        this.#mesh.position.z = this.#carriedBy.#mesh.position.z;
        this.#mesh.position.y = 0.5;
        this.#carriedBy = undefined;
        scene.add( this.#mesh );
    }
    get carriedBy () {
        return this.#carriedBy;
    }

    set opacity (opacity) {
        this.#mesh.material.opacity = opacity;
        this.#label.element.style.visibility  = ( opacity == 0 ? "hidden" : "visible" );
    }

    set color (color) {
        this.#mesh.material.color.setHex( color );
    }

    #text
    get text () {
        return this.#text
    }
    set text (text) {
        this.#text = text
        this.#div.textContent = text
    }

    #div
    #label

    constructor (mesh, x, y, text = null) {

        clickables.push( mesh );

        this.#mesh = mesh
        this.#mesh.position.y = 0.5
        this.x = x
        this.y = y

        this.#mesh.position.set( x * 1.5, 0.5, - y * 1.5 );

        animator.on( 'animate', () => {
            let x = Math.round( this.x );
            let y = Math.round( this.y );
            let targetVector3 = new THREE.Vector3( x * 1.5, this.#mesh.position.y, - y * 1.5 );

                // // Move directly to x and y
                // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
                // this.#mesh.position.copy( targetVector3 );

            if ( x == this.x && y == this.y ) { // if arrived
                this.#mesh.position.lerp( targetVector3, 0.5 );
            } else { // if still moving
                // targetVector3 = new THREE.Vector3( this.x * 1.5, this.#mesh.position.y, - this.y * 1.5 );
                this.#mesh.position.lerp( targetVector3, 0.08 );
            }
        } )
    
        const div = this.#div = document.createElement( 'div' );
        div.className = 'label';
        div.textContent = text;
        div.style.marginTop = '-1em';
    
        const label = this.#label = new CSS2DObject( div );
        label.position.set( 0, 0, 0 );
        label.layers.set( 0 );
        if ( text ) mesh.add( label );
    }

    removeMesh () {
        this.#mesh.remove( this.#label );
        this.#mesh.geometry.dispose();
        this.#mesh.material.dispose();
        scene.remove( this.#mesh );
        if (this.#carriedBy) {
            this.#carriedBy.#mesh.remove( this.#mesh );
            this.#carriedBy.carrying.delete(this.id);
        }
        renderer.renderLists.dispose();
    }

}



class PathPoint {

    show () {
        this.sphere.material.opacity = 1;
    }
    hide () {
        this.sphere.material.opacity = 0;
    }
    
    sphere;

    constructor (x, y) {
        const geometry = new THREE.SphereGeometry( 0.1, 5, 5 );
        const material = new THREE.MeshBasicMaterial( { color: 0xffffff, transparent: true, opacity: 0 } );
        this.sphere = new THREE.Mesh( geometry, material );
        this.sphere.position.set( x * 1.5, 0.1, - y * 1.5 );
        scene.add( this.sphere );
    }

}



const tiles = new Map();
window.getMap = function () {
    const map = [];
    for ( let x=0; x<WIDTH; x++ ) {
        const row = []
        for ( let y=0; y<HEIGHT; y++ ) {
            if ( tiles.has(x + y*1000) ) {
                /**@type {Tile}*/
                let tile = tiles.get( x + y*1000 );
                if ( tile.blocked )
                    row.push(0);
                else if ( tile.delivery )
                    row.push(2);
                else if ( tile.parcelSpawner )
                    row.push(1);
                else
                    row.push(3);
            }
            else {
                row.push(0);
            }
        }
        map.push(row);
    }
    var string = "[\n";
    string += map.map( row => '\t[' + row.join(', ') + ']' ).join( ',\n' )
    // for (const row of map) {
    //     string += '\t[' + row.join(', ') + '],\n';
    // }
    string += "\n]";
    console.log( string );
    return map;
};

class Tile extends onGrid {

    pathPoint;

    #delivery = false;
    get delivery () {
        return this.#delivery;
    }
    set delivery ( value ) {
        this.#delivery = value;
        if ( value )
            this.color = 0xff0000
        else
            this.color = 0x00ff00
    }

    #parcelSpawner = false;
    get parcelSpawner () {
        return this.#parcelSpawner;
    }
    set parcelSpawner ( value ) {
        this.#parcelSpawner = value?true:false;
        if ( value )
            this.color = 0x00ff00
        else if ( ! this.delivery )
            this.color = 0x55dd55
    }
    
    #blocked = false;
    get blocked () {
        return this.#blocked;
    }
    set blocked ( value ) {
        this.#blocked = value;
        if ( value )
            this.color = 0x000000
        else
            this.delivery = this.#delivery;
    }
    
    constructor (x, y, delivery=false) {
        const geometry = new THREE.BoxGeometry( 1, 0.1, 1 );
        const color = delivery ? 0xff0000 : 0x00ff00;
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const cube = new THREE.Mesh( geometry, material );
        scene.add( cube );

        super(cube, x, y);
        cube.position.y = 0;
        this.#delivery = delivery;

        this.pathPoint = new PathPoint(x, y);
    }

}

function setTile(x, y, delivery) {
    if ( !tiles.has(x + y*1000) )
        tiles.set( x + y*1000, new Tile(x, y, delivery) );
    return tiles.get( x + y*1000 );
}

function getTile(x, y) {
    if ( !tiles.has(x + y*1000) )
        tiles.set( x + y*1000, new Tile(x, y) );
    return tiles.get( x + y*1000 );
}



class Parcel extends onGrid {

    id

    #reward
    get reward () {
        return this.#reward
    }
    set reward (reward) {
        this.#reward = reward
        this.text = reward;
    }

    constructor ( id, x, y, carriedBy, reward ) {
        const geometry = new THREE.BoxGeometry( 0.5, 0.5, 0.5 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const parcel = new THREE.Mesh( geometry, material );
        scene.add( parcel );

        super(parcel, x, y, reward)

        this.id = id
        this.#reward = reward

        if (carriedBy) {
            this.pickup( getOrCreateAgent( carriedBy ) )
        }

        // console.log('created parcel', id)
    }

}

var parcels = new Map();

function getOrCreateParcel ( id, x=-1, y=-1, carriedBy=null, reward=-1 ) {
    var parcel = parcels.get(id);
    if ( !parcel ) {
        parcel = new Parcel(id, x, y, carriedBy, reward);
        parcels.set( id, parcel );
    }
    return parcel;
}

function deleteParcel ( id ) {
    getOrCreateParcel( id ).removeMesh();
    parcels.delete( id );
}



class Agent extends onGrid {

    /** @type {string} Map id to parcel */
    id

    /** @type {Map<string,Parcel>} Map id to parcel */
    carrying = new Map();

    // async animateMove (x, y) {
    //     x = Math.round(x)
    //     y = Math.round(y)
    //     for (let i = 0; i < 10; i++) {
    //         await new Promise( res => setTimeout(res, 200 / 10))
    //         if ( super.x != x )
    //             super.x = Math.round( super.x *10 + ( x > super.x ? +1 : -1 ) ) / 10;
    //         if ( super.y != y )
    //             super.y = Math.round( super.y *10 + ( y > super.y ? +1 : -1 ) ) / 10;
    //     }
    // }

    #name = 'loading'
    get name () {
        return this.#name
    }
    set name (name) {
        this.#name = name
        this.text = this.#name+'\n'+this.#score;
    }

    #score = 0
    get score () {
        return this.#score
    }
    set score (score) {
        this.#score = score
        this.text = this.#name+'\n'+this.#score;
    }

    constructor (id, name, x, y, score) {
        const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
        var color = new THREE.Color( 0xffffff );
        color.setHex( Math.random() * 0xffffff );
        const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 1 } );
        const mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );

        super(mesh, x, y, id+'\n'+score)

        this.id = id
        this.score = score
        this.name = name
    }

}



const agents = new Map();



/**
 * 
 * @param {*} id 
 * @param {*} name 
 * @param {*} x 
 * @param {*} y 
 * @param {*} score 
 * @returns {Agent}
 */
function getOrCreateAgent ( id, name='unknown', x=-1, y=-1, score=-1 ) {
    var agent = agents.get(id);
    if ( !agent ) {
        agent = new Agent(id, name, x, y, score);
        agents.set( id, agent );
    }
    return agent;
}



// function createAgent (id) {
//     const geometry = new THREE.ConeGeometry( 0.5, 1, 32 );
//     var color = new THREE.Color( 0xffffff );
//     color.setHex( Math.random() * 0xffffff );
//     const material = new THREE.MeshBasicMaterial( { color, transparent: true, opacity: 0.1 } );
//     const agent = new THREE.Mesh( geometry, material );
//     agent.position.x = 1 * 1.5;
//     agent.position.y = 0.5;
//     agent.position.z = 1 * 1.5;
//     // agent.rotation.x = 90;
//     scene.add( agent );
//     console.log('created agent', id)

//     const earthDiv = document.createElement( 'div' );
//     earthDiv.className = 'label';
//     earthDiv.textContent = id;
//     earthDiv.style.marginTop = '-1em';

//     const earthLabel = new CSS2DObject( earthDiv );
//     earthLabel.position.set( 0, 0, 0 );
//     agent.add( earthLabel );
//     earthLabel.layers.set( 0 );

//     return agent;
// }



function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function checkCookieForToken ( name ) {
    let token = getCookie( 'token_'+name );
    if ( token == "" || token == null ) {
        token = prompt( `No token exists for user ${name}, please insert a valid token or leave empty to get a new one:`, "");
        if ( token != "" && token != null ) {
            setCookie( 'token_'+name, token, 365 );
        }
    } else {
        token = prompt( `Welcome back, ${name}, the browser has this token for you. You can 1) confirm 2) insert a different token 3) leave empty to get a new one.`, token );
        setCookie( 'token_'+name, token, 365 );
    }
    return token;
}

let params = (new URL(document.location)).searchParams;
let name = params.get("name");

// Redirect if no name specified in query
if ( !name ) {
    name = prompt("Enter your name:", "");
    params.set( "name", name )
    document.location.search = params.toString(); //document.location.href
}

// Retrieve existing token, modify it, or get a new one
var token = checkCookieForToken( name )

// Connect
var socket = io( import.meta.env.VITE_SOCKET_IO_HOST || '', {
    extraHeaders: {
        'x-token': token
    },
    query: ( ! token ? { name: params.get("name") } : {} )
} );


var me = getOrCreateAgent('loading', name, 0, 0, 0);
// me.mesh.add( camera );

socket.on( "connect", () => {
    // console.log( "connect", socket.id, token ); // x8WIv7-mJelg7on_ALbx
    document.getElementById('socket.id').textContent = `socket.id ${socket.id}`
});

socket.on( "disconnect", (reason) => {
    if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        alert( `Token is invalid!` );
        socket.connect();
    }
    console.error( `Socket.io connection error` );
});

socket.on("connect_error", (reason) => {
    alert( `Reconnecting, press ok to continue.` );
});

socket.on( "token", (token) => {
    prompt( `Welcome, ${name}, here is your new token. Use it to connect to your new agent.`, token );
    setCookie( 'token_'+name, token, 365 );
    // navigator.clipboard.writeText(token);
});

socket.on( 'log', ( {src, timestamp, socket, id, name}, ...message ) => {
    if ( src == 'server' )
        console.log( 'server', timestamp, '\t', ...message )
    else
        console.log( 'client', timestamp, socket, id, name, '\t', ...message );
} );

socket.on( 'draw', ( {src, timestamp, socket, id, name}, buffer ) => {
    // console.log( 'draw', {src, timestamp, socket, id, name}, buffer )

    // let uint8Array = new Uint8Array(buffer);
    // let binaryString = String.fromCharCode.apply(null, uint8Array);
    // let base64Image = btoa(binaryString);
    // let imgSrc = 'data:image/png;base64,' + base64Image;
    // document.getElementById('canvas').src = imgSrc;

    document.getElementById('canvas').src = buffer;
    
} );

socket.on( 'not_tile', (x, y) => {
    // console.log( 'not_tile', x, y )
    getTile(x, y).blocked = true;
});

socket.on( "tile", (x, y, delivery, parcelSpawner) => {
    // console.log( "tile", x, y, delivery )
    getTile(x, y).delivery = delivery;
    getTile(x, y).blocked = false;
    getTile(x, y).parcelSpawner = parcelSpawner;
});

var WIDTH;
var HEIGHT;
socket.on( "map", (width, height, tiles) => {
    WIDTH = width
    HEIGHT = height
});

socket.on( "msg", ( id, name, msg, reply ) => {
    console.log( 'msg', {id, name, msg, reply} )
    processMsg( id, name, msg )
    if ( msg == 'who are you?' && reply ) reply('I am the web app')
})

socket.on( "path", (path) => {
    for (const tile of tiles.values()) {
        tile.pathPoint.hide();
    }
    for (const {x, y} of path) {
        getTile(x, y).pathPoint.show();
    }
});

var AGENTS_OBSERVATION_DISTANCE = 5;
var PARCELS_OBSERVATION_DISTANCE = 5;
var CONFIG;
socket.on( "config", ( config ) => {
    document.getElementById('config').textContent = JSON.stringify( config, undefined, 2 );
    AGENTS_OBSERVATION_DISTANCE = config.AGENTS_OBSERVATION_DISTANCE;
    PARCELS_OBSERVATION_DISTANCE = config.PARCELS_OBSERVATION_DISTANCE;
    CONFIG = config;
} )

socket.on( "you", ( {id, name, x, y, score} ) => {

    // console.log( "you", {id, name, x, y, score} )
    document.getElementById('agent.id').textContent = `agent.id ${id}`;
    document.getElementById('agent.name').textContent = `agent.name ${name}`;
    document.getElementById('agent.xy').textContent = `agent.xy ${x},${y}`;
    
    // if ( params.get( "id" ) != id ) {
    //     params.set( "id", id )
    //     document.location.search = params.toString();
    // }
    // if ( params.get( "name" ) && params.get( "name" ) != name ) {
    //     params.set( "name", name )
    //     document.location.search = params.toString();
    // }

    me = getOrCreateAgent(id, name, x, y, score);

    /**
     * Auto-follow camera
     */
    // camera.position.x += ( x - me.x ) * 1.5;
    // camera.position.z -= ( y - me.y ) * 1.5;
    // controls.target.set(x*1.5, 0, -y*1.5);
    // controls.update();
    
    // Me
    me.x = x
    me.y = y
    me.score = score

    // when arrived
    if ( x % 1 == 0 && y % 1 == 0 ) {
        for ( var tile of tiles.values() ) {
            var distance = Math.abs(x-tile.x) + Math.abs(y-tile.y);
            let opacity = 0.1;
            if ( !( distance >= PARCELS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
            if ( !( distance >= AGENTS_OBSERVATION_DISTANCE ) ) opacity += 0.2;
            tile.opacity = ( opacity > 0.4 ? 1 : opacity );
        }
    } else { // when moving
        // me.animateMove(x, y)
    }

    updateLeaderboard( me );

});



socket.on("agents sensing", (sensed) => {

    // console.log("agents sensing", ...sensed)//, sensed.length)

    var sensed = Array.from(sensed)
    
    var sensed_ids = sensed.map( ({id}) => id )
    for ( const [id, agent] of agents.entries() ) {
        if ( agent!=me && !sensed_ids.includes( agent.id ) ) {
            agent.opacity = 0;
        }
    }

    for ( const sensed_p of sensed ) {
        const {id, name, x, y, score} = sensed_p;
        var agent = getOrCreateAgent(id, name, x, y, score)
        agent.name = name;
        agent.opacity = 1;
        agent.x = x;
        agent.y = y;
        if ( agent.score != score ) {
            agent.score = score;
            updateLeaderboard( agent );
        }
    }

});

socket.on("parcels sensing", (sensed) => {

    // console.log("parcels sensing", ...sensed)//, sensed.length)

    var sensed = Array.from(sensed)

    var sensed_ids = sensed.map( ({id}) => id )
    for ( const [id, was] of parcels.entries() ) {
        if ( !sensed_ids.includes( was.id ) ) {
            // console.log('no more sensing parcel', knownId)
            // was.opacity = 0;
            deleteParcel( was.id ); // parcel.removeMesh(); // parcels.delete(knownId);
        }
    }

    for ( const {id, x, y, carriedBy, reward} of sensed ) {
        
        const was = getOrCreateParcel(id, x, y, carriedBy, reward);

        if ( carriedBy ) {
            if ( !was.carriedBy ) {
                var agent = getOrCreateAgent( carriedBy );
                was.pickup( agent );
            }
        }
        else {
            if ( was.carriedBy )
                was.putdown(x, y);
            else {
                was.x = x;
                was.y = y;
            }
        }
        was.reward = reward;
    }

});

var action = null;
async function start_doing ( ) {
    while ( action ) {
        let res = await action();
        // if failed stop doing until keyup reset the action
        if ( ! res )
            break;
    }
}

document.onkeyup = function(evt) {
    action = null;
}
document.onkeydown = function(evt) {
    if ( action == null) {
        // do the rest of this function and then call start_doing
        setTimeout( start_doing );
    }
    switch (evt.code) {
        case 'KeyQ':// Q pickup
            action = () => {
                return new Promise( (res) => {
                    // console.log('emit pickup');
                    socket.emit('pickup', (picked) => {
                        // console.log( 'pickup', picked, 'parcels' );
                        // for ( let p of picked ) {
                        //     parcels.get( p.id ).pickup(me);
                        // }
                        res(picked.length>0);
                    } );
                } );
            };
            break;
        case 'KeyE':// E putdown
            action = () => {
                return new Promise( (res) => {
                    // console.log('emit putdown');
                    socket.emit('putdown', null, (dropped) => {
                        // console.log( 'putdown', dropped, 'parcels' );
                        // for ( let p of dropped ) {
                        //     parcels.get( p.id ).putdown();
                        // }
                        res(dropped.length>0);
                    } );
                } );
            };
            break;
        case 'KeyW':// W up
            action = () => {
                return new Promise( (res, rej) => {
                    // console.log('emit move up');
                    socket.emit('move', 'up', (status) => {
                        // console.log( (status ? 'move up done' : 'move up failed') );
                        res(status);
                    } );
                } );
            };
            break;
        case 'KeyA':// A left
            action = () => {
                return new Promise( (res, rej) => {
                    // console.log('emit move left');
                    socket.emit('move', 'left', (status) => {
                        // console.log( (status ? 'move left done' : 'move left failed') );
                        res(status);
                    } );
                } );
            };
            break;
        case 'KeyS':// S down 
            action = () => {
                return new Promise( (res, rej) => {
                    // console.log('emit move down');
                    socket.emit('move', 'down', (status) => {
                        // console.log( (status ? 'move down done' : 'move down failed') );
                        res(status);
                    } );
                } );
            };
            break;
        case 'KeyD':// D right
            action = () => {
                return new Promise( (res, rej) => {
                    // console.log('emit move right');
                    socket.emit('move', 'right', (status) => {
                        // console.log( (status ? 'move right done' : 'move right failed') );
                        res(status);
                    } );
                } );
            };
            break;
        default:
            break;
    }
};





animate();