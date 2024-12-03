import express, {NextFunction, Request, Response} from "express";
import path from "path";
import {MockUserRepository} from "../../infrastructure/repositories/mock/MockUserRepository";
import {UserId} from "../../domain/User/UserId";
import {User} from "../../domain/User/User";
import {UserMap} from "./UserMap";
import {HTTPError} from "../../shared/HTTPError";


const userRepository = new MockUserRepository();

export class UserRouter {
    static setup(app: express.Application) {

        // send all users
        app.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
            try {
                const userId = UserId.create(req.params.id);
                let user: User | undefined;

                const userPersistance = await userRepository.find(userId);
                user = userPersistance ? User.create(userPersistance) : undefined;

                if (user) {
                    console.log(`users`)
                    console.log(await userRepository.getAll())
                    res.status(200).json(UserMap.toDTO(user));
                    return;
                } else {
                    next(new HTTPError(404, 'User not found'));
                }
            } catch (e) {
                next(e);
            }
        });

        app.get('/users', async (req, res, next) => {
            try {
                const users = await userRepository.getAll();
                res.status(200).json(
                    users
                        .map(User.create)
                        .map(UserMap.toDTO)
                );
            } catch (e) {
                next(e);
            }
        })

        app.post('/users', async (req, res, next) => {
            try {
                // get user name from request body
                if (!req.body.name) {
                    next(new HTTPError(400, 'Name is required'));
                    return;
                }
                const user = User.create({
                    name: req.body.name as string,
                })

                await userRepository.save(UserMap.toPersistence(user));

                // set cookie UserId
                res.cookie('UserId', user.id.value);

                res.status(200).json(UserMap.toDTO(user));
            } catch (e) {
                next(e);
            }

        })

        app.put('/users/:id', async (req, res, next) => {
            try {
                const user = User.create({
                    id: req.params.id,
                    name: req.body.name,
                })

                await userRepository.save(UserMap.toPersistence(user));

                res.status(200).json({
                    message: 'User updated. New user name: ' + user.name
                });

            } catch (e) {
                next(e);
            }
        })
    }
}
    
