import { Router } from 'express';
import signInController from './signInController';

const userRoutes = Router();

userRoutes.post('/sign-in', signInController);

export default userRoutes;
