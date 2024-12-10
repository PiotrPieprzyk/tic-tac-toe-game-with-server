import {WebsocketServer} from "./websocket";
import {getApp} from "./app";
import os from "os";

const port = 3000;
const app = getApp();

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
// Start the server
const server = app.listen(port, () => {
    const ipAddress = getLocalIPAddress();
    console.log(`Server is running on:`);
    console.log(`  Local:    http://localhost:${port}`);
    console.log(`  Network:  http://${ipAddress}:${port}`);
});

new WebsocketServer(server);
