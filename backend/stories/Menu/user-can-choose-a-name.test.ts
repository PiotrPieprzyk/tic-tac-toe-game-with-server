import {describe, expect, it, beforeEach, jest} from '@jest/globals';
import supertest from 'supertest';
import {getApp} from '../../src/app';

const request = supertest(getApp());


describe('User can choose a name.', () => {

});

