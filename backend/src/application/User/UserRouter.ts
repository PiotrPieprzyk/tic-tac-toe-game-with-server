import express, {NextFunction, Request, Response} from "express";
import {UserRepository} from "@/domain/User/UserRepository";
import {UserId} from "@/domain/User/UserId";
import {User} from "@/domain/User/User";
import {UserMap} from "@/application/User/UserMap";
import {HTTPError} from "@/shared/HTTPError";

export class UserRouter {
    constructor(private readonly userRepository: UserRepository) {}

    setup(app: express.Application) {

        // send all users
        app.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
            try {

                if (Array.isArray(req.params.id)) {
                    next(new HTTPError(404, 'Do not send multiple ids'));
                    return;
                }

                const userId = UserId.create(req.params.id);
                const user = await this.userRepository.find(userId);

                if (user) {
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
                const users = await this.userRepository.getAll();
                res.status(200).json({
                        results: users.map(UserMap.toDTO)
                    }
                );
            } catch (e) {
                next(e);
            }
        })

        app.post('/users', async (req, res, next) => {
            try {
                const user = User.create({
                    name: req.body.name as string,
                })

                const userNameTaken = !!(await this.userRepository.findByName(user.name.value))

                if (userNameTaken) {
                    next(new HTTPError(400, 'User name already taken'));
                    return;
                }

                await this.userRepository.save(user);

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

                await this.userRepository.save(user);

                res.status(200).json(UserMap.toDTO(user));
            } catch (e) {
                next(e);
            }
        })

        app.delete('/users/:id', async (req, res, next) => {
            try {
                const userId = UserId.create(req.params.id);
                await this.userRepository.delete(userId);
                res.status(200).send();
            } catch (e) {
                next(e);
            }
        })
    }
}
