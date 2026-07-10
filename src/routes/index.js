import { Router } from 'express';
import pokemonRoutes from './pokemonRoutes.js';

const router = Router();
router.use('/', pokemonRoutes);

export default router;
