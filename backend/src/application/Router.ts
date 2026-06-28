import express, {Request, Response} from "express";
import path from "path";
import {UserRouter} from "@/application/User/UserRouter";
import {RoomRouter} from "@/application/Room/RoomRouter";

export class Router {
    static setup(app: express.Application) {
        app.get('/', (req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, './public/index.html'));
        });
        
        UserRouter.setup(app);
        RoomRouter.setup(app);
    }
}
