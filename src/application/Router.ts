import express, {Request, Response} from "express";
import path from "path";
import {UserRouter} from "./User/UserRouter";

export class Router {
    static setup(app: express.Application) {
        app.get('/', (req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, './public/index.html'));
        });
        
        UserRouter.setup(app);
    }
}
