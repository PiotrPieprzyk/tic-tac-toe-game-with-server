import express, {NextFunction, Request, Response} from 'express';
import path from 'path';
import os from 'os';
import {WebsocketServer} from "./websocket";
import {Router} from "./application/Router";
import {HTTPError} from "./shared/HTTPError";

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());


// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, './public')));

// Find the local IP address
function getLocalIPAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        if (!interfaces[name]) {
            continue;
        }
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

Router.setup(app);

// HTTP error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HTTPError) {
        res.status(err.status).json({
            error: {
                message: err.message,
                status: err.status
            }
        });
    } else {
        console.log('OPS')
        console.log(err);
        res.status(500).json({
            error: {
                message: 'Internal Server Error',
                status: 500
            }
        });
    }
});


// Start the server
const server = app.listen(port, () => {
    const ipAddress = getLocalIPAddress();
    console.log(`Server is running on:`);
    console.log(`  Local:    http://localhost:${port}`);
    console.log(`  Network:  http://${ipAddress}:${port}`);
});

new WebsocketServer(server);
