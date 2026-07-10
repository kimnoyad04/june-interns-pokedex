import { Router } from 'express';
import * as pokemonController from '../controllers/pokemonController.js';

const router = Router();

router.get('/', pokemonController.getHomePage);
router.get('/search', pokemonController.searchPokemon);
router.get('/type/:type', pokemonController.getPokemonByType);
router.get('/pokemon/:nameOrId', pokemonController.getPokemonDetails);

router.get('/api/pokemon', pokemonController.apiGetAllPokemon);
router.get('/api/pokemon/search', pokemonController.apiSearchPokemon);
router.get('/api/pokemon/:nameOrId', pokemonController.apiGetPokemonDetails);
router.get('/api/types', pokemonController.apiGetTypes);
router.get('/api/types/:type', pokemonController.apiGetPokemonByType);

export default router;
