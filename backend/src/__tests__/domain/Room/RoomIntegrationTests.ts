import {describe, expect, it, beforeEach, jest} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '../../../app';
import {UserDTO} from "../../../application/User/UserMap";
import {RoomDTO} from "../../../application/Room/RoomMap";

const request = supertest(getApp());


describe('Room Integration Tests', () => {

    describe('Story nr.1', () => {
        let user1: UserDTO;
        let user2: UserDTO;
        let room: RoomDTO;
        
        it('Two users has been created', async () => {
            const response1 = await request.post('/users').send({name: 'User1'});
            const response2 = await request.post('/users').send({name: 'User2'});

            user1 = response1.body;
            user2 = response2.body;
            
            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
        })
        
        it('User1 creates a room', async () => {
            const response = await request.post('/rooms').send({name: 'Room1', hostId: user1.id, usersIds: [user1.id]});
            room = response.body;
            expect(response.status).toBe(200);
        })
        
        it('User1 get the room 1# time', async () => {
            const response = await request.get(`/rooms/${room.id}`);
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(room.id);
            expect(response.body.hostId).toBe(user1.id);
            expect(response.body.users).toHaveLength(1);
            expect(response.body.users).toContainEqual(user1);
        })
        
        it('User2 joins the room', async () => {
            const response = await request.put(`/rooms/${room.id}/join`).send({userId: user2.id});
            expect(response.status).toBe(200);
        })
        
        it('User2 get the room 1# time', async () => {
            const response = await request.get(`/rooms/${room.id}`);
            
            room = response.body;
            
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(room.id);
            expect(response.body.hostId).toBe(user1.id);
            expect(response.body.users).toHaveLength(2);
            expect(response.body.users).toContainEqual(user1);
            expect(response.body.users).toContainEqual(user2);
        });
        
        it('User2 leaves the room', async () => {
            const response = await request.put(`/rooms/${room.id}/leave`).send({userId: user2.id});
            expect(response.status).toBe(200);
        });
        
        it('User1 get the room 2# time', async () => {
            const response = await request.get(`/rooms/${room.id}`);
            
            room = response.body;
            
            expect(response.status).toBe(200);
            expect(response.body.id).toBe(room.id);
            expect(response.body.hostId).toBe(user1.id);
            expect(response.body.users).toHaveLength(1);
            expect(response.body.users).toContainEqual(user1);
        })
        
        it('User1 deletes the room', async () => {
            const response = await request.delete(`/rooms/${room.id}`);
            expect(response.status).toBe(200);
        })
        
        it('User1 get the room 3# time', async () => {
            const response = await request.get(`/rooms/${room.id}`);
            expect(response.status).toBe(404);
        })
        
        it('User1 deletes the room 2# time', async () => {
            const response = await request.delete(`/rooms/${room.id}`);
            expect(response.status).toBe(200);
        })
        
        it('Users are deleted', async () => {
            const response1 = await request.delete(`/users/${user1.id}`);
            const response2 = await request.delete(`/users/${user2.id}`);
            
            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
        })
        
        it('Users has been removed from the app', async () => {
            const response1 = await request.get(`/users/${user1.id}`);
            const response2 = await request.get(`/users/${user2.id}`);
            
            expect(response1.status).toBe(404);
            expect(response2.status).toBe(404);
        })
    })
    
    describe('Story nr.2', () => {
        let user1: UserDTO;
        let user2: UserDTO;
        let user3: UserDTO;
        let room1: RoomDTO;
        let room2: RoomDTO;

        it('Two users has been created', async () => {
            const response1 = await request.post('/users').send({name: 'User1'});
            const response2 = await request.post('/users').send({name: 'User2'});
            const response3 = await request.post('/users').send({name: 'User2'});

            user1 = response1.body;
            user2 = response2.body;
            user3 = response3.body;

            expect(response1.status).toBe(200);
            expect(response2.status).toBe(200);
            expect(response3.status).toBe(200);
        })
        
        it('User1 creates a room', async () => {
            const response = await request.post('/rooms').send({name: 'Room1', hostId: user1.id, usersIds: [user1.id]});
            room1 = response.body;
            expect(response.status).toBe(200);
        });
        
        it('User2 creates a room', async () => {
            const response = await request.post('/rooms').send({name: 'Room2', hostId: user2.id, usersIds: [user2.id]});
            room2 = response.body;
            expect(response.status).toBe(200);
        });
        
        it('User 3 can get 2 rooms', async () => {
            const response = await request.get('/rooms');
            expect(response.status).toBe(200);
            expect(response.body.results).toHaveLength(2);
            expect(response.body.results).toContainEqual(room1);
            expect(response.body.results).toContainEqual(room2);
        });
        
        it('User1 deletes the room 1', async () => {
            const response = await request.delete(`/rooms/${room1.id}`);
            expect(response.status).toBe(200);
        })
        
        it('User2 deletes the room 2', async () => {
            const response = await request.delete(`/rooms/${room2.id}`);
            expect(response.status).toBe(200);
        })
        
        it('User 3 cannot get any room', async () => {
            const response = await request.get('/rooms');
            expect(response.status).toBe(200);
            expect(response.body.results).toHaveLength(0);
        });
    })

    
    
    
});

