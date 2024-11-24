import express, {Request, Response} from "express";
import path from "path";

export class Router {
    static setup(app: express.Application) {
        app.get('/', (req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, './public/index.html'));
        });

        // Define an API endpoint at /api/data
        app.post('/api/data', (req: Request, res: Response) => {
            const receivedData = req.body;

            console.log('Received JSON data:', receivedData);

            // Example of sending back a JSON response
            const responseData = {
                message: 'Data received successfully!',
                receivedData,
            };

            res.json(responseData);
        });
    }
}
