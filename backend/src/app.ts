import express, {NextFunction, Request, Response} from "express";
import path from "path";
import {Router, RouterRepositories} from "@/application/Router";
import {HTTPError} from "@/shared/HTTPError";
import {DomainError} from "@/shared/DomainError";
import cors from "cors";
import cookieParser from "cookie-parser";
import {MockUserRepository} from "@/infrastructure/repositories/mock/MockUserRepository";
import {MockRoomRepository} from "@/infrastructure/repositories/mock/MockRoomRepository";
import {MockGameRepository} from "@/infrastructure/repositories/mock/MockGameRepository";
import {WebsocketBroadcaster} from "@/infrastructure/realtime/WebsocketBroadcaster";

const defaultRepositories = (): RouterRepositories => ({
    userRepository: MockUserRepository.create(),
    roomRepository: MockRoomRepository.create(),
    gameRepository: MockGameRepository.create(),
    eventBroadcaster: WebsocketBroadcaster.create(),
});

export const getApp = (repositories: RouterRepositories = defaultRepositories()) => {
    const app = express();

    // Middleware to parse JSON bodies
    app.use(express.json());

    // Middleware to parse cookies
    app.use(cookieParser());


    // Serve static files from the "public" directory
    app.use(express.static(path.join(__dirname, './public')));

    app.use(cors({
        origin: ['http://127.0.0.1:4000'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }));

    Router.setup(app, repositories);

    // HTTP error handling
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        if (err instanceof HTTPError || err instanceof DomainError) {
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
