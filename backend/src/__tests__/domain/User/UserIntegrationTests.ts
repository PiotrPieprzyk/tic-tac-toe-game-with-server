import {describe, expect, it, beforeEach, jest} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '../../../app';

const request = supertest(getApp());


describe('User Integration Tests', () => {
    describe('Story nr.1', () => {
        let userId: string;

        it('User is created.', async () => {
            const response = await request.post('/users').send({
                name: 'User Name',
            });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name');
            expect(response.body.name).toBe('User Name');

            userId = response.body.id;
        });

        it('User is retrieved.', async () => {
            const response = await request.get(`/users/${userId}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name');
            expect(response.body.name).toBe('User Name');
        })

        it('User is updated.', async () => {
            const response = await request.put(`/users/${userId}`).send({
                name: 'Updated User Name',
            });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('name');
            expect(response.body.name).toBe('Updated User Name');
        })
        
        it('User is deleted.', async () => {
            const response = await request.delete(`/users/${userId}`);
            expect(response.status).toBe(200);
            const response2 = await request.get(`/users`);
            expect(response2.body.results).toHaveLength(0);
        })
    })

    describe('Story nr.2', () => {
        let userIds: string[] = [];
        it('Two users are created.', async () => {
            const response1 = await request.post('/users').send({
                name: 'User Name 1',
            });
            const response2 = await request.post('/users').send({
                name: 'User Name 2',
            });

            expect(response1.status).toBe(200);
            expect(response1.body).toHaveProperty('id');
            expect(response1.body).toHaveProperty('name');
            expect(response1.body.name).toBe('User Name 1');

            expect(response2.status).toBe(200);
            expect(response2.body).toHaveProperty('id');
            expect(response2.body).toHaveProperty('name');
            expect(response2.body.name).toBe('User Name 2');

            userIds = [response1.body.id, response2.body.id];
        })

        it('All users are retrieved.', async () => {
            const response = await request.get('/users');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('results');
            // in the body we can find the two users created in the previous te
            userIds.forEach((userId) => {
                expect(response.body.results).toContainEqual(expect.objectContaining({id: userId}));
            })
        })

        it('All users are deleted.', async () => {
            const response1 = await request.delete(`/users/${userIds[0]}`);
            expect(response1.status).toBe(200);
            const response2 = await request.delete(`/users/${userIds[1]}`);
            expect(response2.status).toBe(200);
            const response3 = await request.get(`/users`);
            expect(response3.body.results).toHaveLength(0);
        })
    })

});

