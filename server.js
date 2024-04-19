const express = require('express');
const passport = require('passport');
const session = require('express-session');
const pino = require('pino');
const fs = require('fs');

const path = require('path');
const dotenv = require('dotenv');

const { initializeGlobals } = require('./Helpers/globals');
const databaseModule = require('./Modules/database.js');

const startServer = async () => {
    /**********************************
     *     INITIALIZE GLOBAL VARS     *
     **********************************/
    initializeGlobals();

    /*****************************
     *   HANDLE LOGGING MODULE   *
     *****************************/
    const dateNow = new Date();
    const dateTimeFormat = JSON.stringify(dateNow)
        .replaceAll('"', '')
        .replaceAll(':', '-')
        .replaceAll('T', '_at_')
        .replace(/\..*/, '');

    if (!fs.existsSync('./logs')) {
        fs.mkdirSync('./logs');
    }

    const fileDest = `./logs/${dateTimeFormat}.log`;
    const logFile = fs.createWriteStream(fileDest);
    const logger = pino(
        {
            colorize: true,
            level: 'debug',
            transport: {
                targets: [
                    {
                        level: 'debug',
                        target: 'pino-pretty',
                        options: {},
                    },
                    {
                        level: 'debug',
                        target: 'pino/file',
                        options: { destination: fileDest },
                    },
                ],
            },
        },
        pino.destination(logFile)
    );

    log = logger;

    /**********************************
     *     INITIALIZE DATABASE        *
     **********************************/

    /* Connect to mongoDB */
    const connectResponse = await databaseModule.connect();

    if (connectResponse.res === 'error') {
        log.error(`Failed to connect to database. ${connectResponse.data}`);
    }

    log.info(connectResponse.data);

    global.database = databaseModule.getDatabase();
    log.info('Database successfully initialized.');

    /*************************************
     *     INITIALIZE DISCORD MODULES    *
     *************************************/
    require('./Helpers/initializeDiscordModules');

    /****************************
     *	      MIDDLEWARE        *
     ****************************/
    log.info('Initializing server middleware.');

    dotenv.config();

    const app = express();
    const port = process.env.PORT;

    app.use(express.json({ extended: false }));

    /**********************************
     *	     PASSPORT MIDDLEWARE      *
     **********************************/
    require('./Auth/DiscordAuth')(passport);

    app.use(
        session({
            secret: 'my secret',
            name: 'name of session id',
            resave: true,
            saveUninitialized: false,
            cookie: { maxAge: gTime.days(30) },
        })
    );
    app.use(passport.initialize());
    app.use(passport.session());

    app.use((req, res, next) => {
        //make a global variable called user which request the current user
        res.locals.user = req.user || null;
        next();
    });

    /**********************************
     *	   IMPORT DEFINED ROUTES      *
     **********************************/
    const audioRoutes = require('./routes/audio');
    const discordServerRoutes = require('./routes/discordServer');
    const authRoutes = require('./routes/auth');
    const userRoutes = require('./routes/user');

    /***************************
     *	    DECLARE ROUTES     *
     ***************************/
    app.use('/api/audio', audioRoutes);
    app.use('/api/discordserver', discordServerRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/user', userRoutes);

    /****************************
     *    SERVE CLIENT ASSETS   *
     ****************************/
    log.info('Serving client-side assets');

    if (process.env.NODE_ENV === 'production') {
        app.use(express.static('client/build'));

        app.get('*', (_, res) => {
            res.sendFile(
                path.resolve(__dirname, 'client', 'build', 'index.html')
            );
        });
    }

    const PORT = port || 3000;

    app.listen(PORT, logger.info(`Server started on port: ${PORT}`));
};

startServer();
