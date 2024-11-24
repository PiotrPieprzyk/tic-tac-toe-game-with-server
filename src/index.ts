import express from 'express';
import path from 'path';
import os from 'os';
import {WebsocketServer} from "./websocket";
import {Router} from "./Router";

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

// Start the server
const server = app.listen(port, () => {
    const ipAddress = getLocalIPAddress();
    console.log(`Server is running on:`);
    console.log(`  Local:    http://localhost:${port}`);
    console.log(`  Network:  http://${ipAddress}:${port}`);
});

new WebsocketServer(server);
