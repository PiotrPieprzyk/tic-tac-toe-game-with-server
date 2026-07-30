import express, {Request, Response} from "express";
import path from "path";
import {UserRouter} from "@/application/User/UserRouter";
import {RoomRouter} from "@/application/Room/RoomRouter";
import {GameRouter} from "@/application/Game/GameRouter";
import {UserRepository} from "@/domain/User/UserRepository";
import {RoomRepository} from "@/domain/Room/RoomRepository";
import {GameRepository} from "@/domain/Game/GameRepository";

export interface RouterRepositories {
    userRepository: UserRepository;
    roomRepository: RoomRepository;
    gameRepository: GameRepository;
}

export class Router {
    static setup(app: express.Application, repositories: RouterRepositories) {
        app.get('/', (req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, './public/index.html'));
        });

        const {userRepository, roomRepository, gameRepository} = repositories;

        new UserRouter(userRepository).setup(app);
        new RoomRouter(roomRepository, userRepository, gameRepository).setup(app);
        new GameRouter(gameRepository, userRepository).setup(app);
    }
}
