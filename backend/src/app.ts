import express, {NextFunction, Request, Response} from "express";
import path from "path";
import {Router} from "./application/Router";
import {HTTPError} from "./shared/HTTPError";
import cors from "cors";


export const getApp = () => {
    const app = express();

    // Middleware to parse JSON bodies
    app.use(express.json());


    // Serve static files from the "public" directory
    app.use(express.static(path.join(__dirname, './public')));

    app.use(cors({
        origin: ['http://127.0.0.1:4000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }));

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
            console.error(err);
            console.log(req.params);
            console.log(req.body);
            console.log(req.path);
            res.status(500).json({
                error: {
                    message: 'Internal Server Error',
                    status: 500
                }
            });
        }
    });

    return app;
}
