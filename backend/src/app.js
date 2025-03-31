const express = require('express');
const cors = require('cors');
const Path = require('path');
const app = express();

const apiRoutes = require('./routes/api');
const configRoutes = require('./routes/configs');
const mapsRoutes = require('./routes/maps');
const agentsRoutes = require('./routes/agents');
const levelsRoutes = require('./routes/levels');
const npcsRoutes = require('./routes/npcs');
const { tokenMiddleware, verifyTokenMiddleware, signTokenMiddleware } = require('./middlewares/token');


/**
 * Serve front-end static files
 */

// Local monorepo build of frontend
app.use( '/',
    express.static( Path.join(__dirname, '..', '..', 'frontend', 'dist'), {
        setHeaders: (res, path) => {
            res.set('X-Frontend', '../frontend/dist;');
        }
    } )
);

// Remote frontend package, as installed from npmjs registry
app.use( '/',
    express.static( Path.join(__dirname, '../node_modules/@unitn-asa/deliveroo-js-webapp-dist'), {
        setHeaders: (res, path) => {
            res.set('X-Frontend', 'deliveroo-js-webapp-dist;');
        }
    } )
);



// Middleware per gestire i dati JSON
app.use(express.json());

// Middleware per chiamate cors
app.use(cors({
    origin: '*',
    credentials: false, // https://socket.io/docs/v4/handling-cors/#credential-is-not-supported-if-the-cors-header-access-control-allow-origin-is-
    allowedHeaders: '*'
}));

//Middleware to login with a name
app.use( verifyTokenMiddleware ); // Decode token if any

/**********************************************/
/*                     API                    */
/*                                            */

// app.get('/api', (req, res) => {
//     res.status(200).json({
//         message: 'Welcome to the API'
//     });
// })
app.use('/api', apiRoutes);

// return the generated token
app.use('/api/tokens', signTokenMiddleware, (req, res) => {

    if ( ! req['token'] ) {
        console.error(`${req.method} ${req.url} - Login failed, no name specified.`);
        res.status(401).json({
            message: 'Login failed, no name specified.'
        });
        return;
    }

    res.status(200).json({
        message: 'Login successful',
        token: req['token'],
        payload: req['payload']
    });

});

app.use('/api/configs', configRoutes);          // api/configs      GET config by roomId
app.use('/api/maps', mapsRoutes);               // api/maps         GET, POST, GET/:id as json, GET/:id.png as png
app.use('/api/agents', agentsRoutes);           // api/agents       GET agents on the grid
app.use('/api/levels', levelsRoutes);           // api/levels       GET levels
app.use('/api/npcs', npcsRoutes);               // api/npcs         GET, GET/:id, PATCH, POST

app.use( (err, req, res, next) => { 
    console.error(err.stack); 
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    }); 
})

/*                                            */
/*                                            */
/**********************************************/



module.exports = app;