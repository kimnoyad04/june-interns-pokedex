import * as pokemonRepository from '../repositories/pokemonRepository.js';
import { config } from '../config/index.js';

const formatName = (name) => {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatStatName = (name) => {
  const statNames = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed'
  };

  return statNames[name] || formatName(name);
};

const formatPokemonData = (pokemon, species = null) => {
  const description =
    species?.flavor_text_entries
      ?.find((entry) => entry.language.name === 'en')
      ?.flavor_text?.replace(/[\f\n\r]/g, ' ')
      ?.replace(/\s+/g, ' ')
      ?.trim() || 'No description available.';

  const genus = species?.genera?.find((entry) => entry.language.name === 'en')?.genus || 'Unknown';

  const stats = pokemon.stats.map((stat) => ({
    name: formatStatName(stat.stat.name),
    value: stat.base_stat
  }));

  const totalStats = stats.reduce((sum, stat) => sum + stat.value, 0);

  return {
    id: pokemon.id,
    name: pokemon.name,
    displayName: formatName(pokemon.name),
    image:
      pokemon.sprites?.other?.['official-artwork']?.front_default ||
      pokemon.sprites?.front_default ||
      '',
    sprite: pokemon.sprites?.front_default || '',
    types: pokemon.types.map((type) => type.type.name),
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    abilities: pokemon.abilities.map((ability) => ({
      name: formatName(ability.ability.name),
      isHidden: ability.is_hidden
    })),
    stats,
    totalStats,
    description,
    genus,
    color: species?.color?.name || 'gray',
    captureRate: species?.capture_rate || 0,
    baseHappiness: species?.base_happiness || 0
  };
};

export const getPokemonDetails = async (nameOrId) => {
  const pokemon = await pokemonRepository.getPokemonByNameOrId(nameOrId);
  if (!pokemon) {
    return null;
  }

  let species = null;
  try {
    species = await pokemonRepository.getPokemonSpecies(pokemon.id);
  } catch {
    species = null;
  }

  return formatPokemonData(pokemon, species);
};

export const getAllPokemon = async (page = 1, limit = config.pagination.defaultLimit) => {
  const offset = (page - 1) * limit;
  const data = await pokemonRepository.getAllPokemon(limit, offset);

  const pokemonWithDetails = await Promise.all(
    data.results.map((pokemon) => getPokemonDetails(pokemon.name))
  );

  return {
    pokemon: pokemonWithDetails.filter((pokemon) => pokemon !== null),
    totalCount: data.count,
    currentPage: page,
    totalPages: Math.ceil(data.count / limit),
    hasNextPage: offset + limit < data.count,
    hasPrevPage: page > 1
  };
};

export const searchPokemon = async (query) => {
  if (!query || query.trim().length === 0) {
    return { pokemon: [], totalCount: 0 };
  }

  const exactMatch = await pokemonRepository.getPokemonByNameOrId(query);
  if (exactMatch) {
    const formatted = await getPokemonDetails(query);
    return {
      pokemon: formatted ? [formatted] : [],
      totalCount: formatted ? 1 : 0
    };
  }

  const searchResults = await pokemonRepository.searchPokemon(query);
  const pokemonWithDetails = await Promise.all(
    searchResults.results.slice(0, 20).map((pokemon) => getPokemonDetails(pokemon.name))
  );

  return {
    pokemon: pokemonWithDetails.filter((pokemon) => pokemon !== null),
    totalCount: searchResults.count
  };
};

export const getPokemonTypes = async () => {
  const types = await pokemonRepository.getPokemonTypes();

  return types
    .filter((type) => type.name !== 'unknown' && type.name !== 'shadow')
    .map((type) => ({ name: type.name, displayName: formatName(type.name) }));
};

export const getPokemonByType = async (
  typeName,
  page = 1,
  limit = config.pagination.defaultLimit
) => {
  const pokemonList = await pokemonRepository.getPokemonByType(typeName);
  if (!pokemonList) {
    return null;
  }

  const offset = (page - 1) * limit;
  const paginatedList = pokemonList.slice(offset, offset + limit);
  const pokemonWithDetails = await Promise.all(
    paginatedList.map((pokemon) => getPokemonDetails(pokemon.name))
  );

  return {
    pokemon: pokemonWithDetails.filter((pokemon) => pokemon !== null),
    type: typeName,
    totalCount: pokemonList.length,
    currentPage: page,
    totalPages: Math.ceil(pokemonList.length / limit),
    hasNextPage: offset + limit < pokemonList.length,
    hasPrevPage: page > 1
  };
};
