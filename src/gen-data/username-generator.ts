const list1 = new Set([
    "Crypto", "Stellar", "Quantum", "Astro", "Solar", "Lunar", "Atomic", "Meta", "Turbo", "Swift",
    "Cosmic", "Neon", "Pixel", "Glitch", "Cyber", "Nova", "Dynamic", "Eternal", "Frost", "Hyper",
    "Velocity", "Primal", "Vortex", "Radial", "Phantom", "Galactic", "Mystic", "Aurora", "Orbit", "Fusion",
    "Shadow", "Blazing", "Flare", "Warp", "Epic", "Silent", "Tidal", "Chrono", "Zeta", "Proto",
    "Sonic", "Radiant", "Infinite", "Aether", "Elemental", "Dynamo", "Circuit", "Super", "Mega", "Ultra",
    "Alpha", "Beta", "Omega", "Ecliptic", "Solaris", "Nebula", "Celestial", "Ethereal", "Arcane", "Rogue",
    "Magnetic", "Void", "Horizon", "Stasis", "Eon", "Echo", "Binary", "Xeno", "Gravity", "Zenith",
    "Prismatic", "Catalyst", "Luminous", "Titan", "Empyrean", "Nimbus", "Blitz", "Momentum", "Auric", "Spectral",
    "Cobalt", "Nitro", "Fluent", "Vivid", "Crimson", "Viridian", "Helix", "Orbiting", "Ascend", "Core",
    "Luminary", "Prime", "Halo", "Pulsar", "Solaris", "Axial", "Ignite", "Mirage", "Polar", "Throne"
  ]);
  
  const list2 = new Set([
    "Whiz", "Guru", "Scout", "Rider", "Pilot", "Master", "Seeker", "Mage", "Pioneer", "Guardian",
    "Explorer", "Sage", "Nomad", "Creator", "Crafter", "Hacker", "Builder", "Watcher", "Runner", "Wizard",
    "Dreamer", "Architect", "Traveler", "Pathfinder", "Challenger", "Voyager", "Champion", "Ranger", "Rogue", "Warden",
    "Sentinel", "Virtuoso", "Conqueror", "Inventor", "Forger", "Innovator", "Observer", "Navigator", "Strategist", "Craftsman",
    "Adventurer", "Technologist", "Designer", "Visionary", "Scholar", "Maker", "Constructor", "Assembler", "Fixer", "Guardian",
    "Tactician", "Operator", "Engineer", "Handler", "Handler", "Solver", "Miner", "Pilot", "Artist", "Writer",
    "Researcher", "Analyzer", "Builder", "Carver", "Planter", "Gatherer", "Discoverer", "Harvester", "Leader", "Follower",
    "Searcher", "Fighter", "Balancer", "Experimenter", "Explorer", "Thinker", "Mover", "Breaker", "Uniter", "Transformer",
    "Jumper", "Switcher", "Striker", "Shaper", "Climber", "Assembler", "Technician", "Reinforcer", "Evolver", "Innovator",
    "Pilot", "Orchestrator", "Harbinger", "Mapper", "Decoder", "Encoder", "Shuffler", "Tinker", "Crafter", "Polisher"
  ]);



  export function generateUniqueUsername(): string {
    const usedCombinations = new Set<string>(); // SHOULD COME FROM A SOURCE
    const list1Array = Array.from(list1);
    const list2Array = Array.from(list2);
  
    const word1 = list1Array[Math.floor(Math.random() * list1Array.length)];
    const word2 = list2Array[Math.floor(Math.random() * list2Array.length)];
    const username = `${word1}${word2}.sol`;
  

    // MIGHT REMOVE CHECK
    if (usedCombinations.has(username)) {
      return generateUniqueUsername();
    }
  
    return username;
  }
  