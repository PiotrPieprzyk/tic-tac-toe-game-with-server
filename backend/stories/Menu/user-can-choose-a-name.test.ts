import {describe, expect, it, afterAll} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '../../src/app';

const request = supertest(getApp());

describe('User can choose a name.', () => {
    const createdUserIds: string[] = [];

    afterAll(async () => {
        await Promise.all(createdUserIds.map(id => request.delete(`/users/${id}`)));
    });

    it('WHEN user is created with correct username SHOULD get 200', async () => {
        const response = await request.post('/users').send({name: 'ValidName'});

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name');
        expect(response.body.name).toBe('ValidName');

        createdUserIds.push(response.body.id);
    });

    it('WHEN user is created with username longer than 20 characters SHOULD get 400 error', async () => {
        const countBefore = (await request.get('/users')).body.results.length;

        const response = await request.post('/users').send({name: 'A'.repeat(21)});

        expect(response.status).toBe(400);
        const countAfter = (await request.get('/users')).body.results.length;
        expect(countAfter).toBe(countBefore);
    });

    it('WHEN user is created with username shorter than 3 characters SHOULD get 400 error', async () => {
        const countBefore = (await request.get('/users')).body.results.length;

        const response = await request.post('/users').send({name: 'AB'});

        expect(response.status).toBe(400);
        const countAfter = (await request.get('/users')).body.results.length;
        expect(countAfter).toBe(countBefore);
    });

    it('WHEN user is created with username already taken SHOULD get 400 error', async () => {
        const firstResponse = await request.post('/users').send({name: 'TakenName'});
        expect(firstResponse.status).toBe(200);
        createdUserIds.push(firstResponse.body.id);

        const secondResponse = await request.post('/users').send({name: 'TakenName'});

        expect(secondResponse.status).toBe(400);
        const usersWithName = (await request.get('/users')).body.results.filter(
            (u: {name: string}) => u.name === 'TakenName'
        );
        expect(usersWithName).toHaveLength(1);
    });

    it('WHEN user is created with incorrect parameter SHOULD get 400 error', async () => {
        const countBefore = (await request.get('/users')).body.results.length;

        const response = await request.post('/users').send({username: 'ValidName'});

        expect(response.status).toBe(400);
        const countAfter = (await request.get('/users')).body.results.length;
        expect(countAfter).toBe(countBefore);
    });
});
