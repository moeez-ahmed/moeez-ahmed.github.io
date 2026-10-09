/* =====================================================================
   ALL SITE CONTENT LIVES IN THIS ONE FILE.

   - Add a project:   copy any block inside PROJECTS, change the fields.
   - Add a film:      copy a block inside FILMS (chapters are optional).
   - Add a job:       copy a block inside EXPERIENCE.
   - Images / videos: drop them in /assets/img or /assets/video and
                      point the paths below at them.

   Optional fields can simply be deleted. Nothing else needs editing.
   See README.md for the full field list.
   ===================================================================== */

export const SITE = {
  name: "Moeez Ahmed Shah",
  initials: "MS",
  role: "Senior game developer and gameplay architect, Unreal Engine and Unity",
  tagline:
    "I build the systems that make game worlds feel alive: open worlds, multiplayer, and characters that talk back.",
  location: "Karachi, Pakistan",
  email: "moeezshah2019@gmail.com",
  linkedin: "https://www.linkedin.com/in/moeez-shah-3670091b0/",
  cv: "assets/cv/Moeez-Ahmed-Shah-CV.pdf",

  heroVideo: "assets/video/wahm-loop.mp4",
  heroPoster: "assets/img/hero-poster.jpg",
  heroFilm: "wahm", // which film the "Watch" button opens

  about: [
    "I've spent five years building games and real-time worlds, and four of them leading the teams that ship them: gameplay developers, backend engineers, QA and art.",
    "My work sits where gameplay meets architecture. I build open worlds on Lyra and Mass Entity, multiplayer on listen and dedicated servers, and NPCs that hold real conversations through NVIDIA ACE and LLM-driven dialogue. In Unity I've written a custom ECS and RenderGraph shaders to put a real city on a phone.",
    "Today I'm a senior game developer at Dabbtech / 101-Dev NASTP in Karachi, leading WAHM, KingdomLand, Kick Arena and Tamr Farm: hands-on in the code, and guiding the developers and designers on each.",
  ],
  recognition: "Employee Spotlight of the Year",
  engines: ["Unreal Engine 5", "Unity 6"],
  education: "BE Computer Software Engineering, Bahria University",
};

/* ---------------------------------------------------------------------
   FILMS — the cinematic player. `project` links to a PROJECTS id.
   chapter `t` is the start time in seconds.
   --------------------------------------------------------------------- */
export const FILMS = [
  {
    id: "wahm",
    project: "wahm",
    title: "WAHM",
    native: "وهم",
    src: "assets/video/wahm-film.mp4",
    poster: "assets/img/wahm-poster.jpg",
    duration: "2:36",
    blurb:
      "A gameplay proof of concept in five chapters, all in-engine footage. Built in Unreal Engine 5.8 and still in a long development cycle.",
    chapters: [
      { t: 0, title: "Opening" },
      { t: 8, title: "The alleys" },
      { t: 23, title: "The climb" },
      { t: 47, title: "The market" },
      { t: 73, title: "The rooftops" },
      { t: 102, title: "The escape" },
    ],
  },
  {
    id: "kingdomland",
    project: "kingdomland",
    title: "KingdomLand",
    native: "",
    src: "assets/video/kingdomland-film.mp4",
    poster: "assets/img/kingdomland-poster.jpg",
    duration: "5:28",
    blurb:
      "A full walkthrough of the Unreal Engine version: exploring Riyadh, owning and trading land, and building on it.",
    chapters: [
      { t: 0, title: "Introduction" },
      { t: 5, title: "Explore the city" },
      { t: 49, title: "Your avatar" },
      { t: 123, title: "Own land" },
      { t: 137, title: "Trade" },
      { t: 187, title: "Build" },
      { t: 255, title: "Build mode" },
    ],
  },
  {
    id: "ggc",
    project: "grand-gangsta-city",
    title: "Grand Gangsta City",
    native: "",
    src: "assets/video/ggc-film.mp4",
    poster: "assets/img/ggc-poster.jpg",
    duration: "0:54",
    blurb:
      "Gameplay from Grand Gangsta City, built at Viral Vind Technologies in Unreal Engine 5 on the Lyra framework.",
    chapters: [
      { t: 0, title: "The call" },
      { t: 8, title: "The drive" },
      { t: 15, title: "The hit" },
      { t: 29, title: "Shootout" },
      { t: 41, title: "The bridge" },
      { t: 44, title: "The courtyard" },
    ],
  },
  {
    id: "apes-planet",
    project: "apes-planet",
    title: "Apes Planet",
    native: "",
    src: "assets/video/apes-planet-film.mp4",
    poster: "assets/img/apes-planet-poster.jpg",
    duration: "1:20",
    blurb:
      "Highlights from the Apes Planet multiplayer experience in Unreal Engine 4.27: a fighting game, a boss raid, racing and more.",
    chapters: [
      { t: 0, title: "The fighting game" },
      { t: 14, title: "Obstacle run" },
      { t: 28, title: "Boss raid" },
      { t: 44, title: "Racing" },
      { t: 60, title: "Flight" },
      { t: 72, title: "Quests" },
    ],
  },
  {
    id: "beegames",
    project: "beegames",
    title: "BeeGames",
    native: "",
    src: "assets/video/beegames-film.mp4",
    poster: "assets/img/beegames-poster.jpg",
    duration: "0:32",
    blurb: "Two of the real-time multiplayer WebGL games from BeeGames, built in Unity.",
    chapters: [
      { t: 0, title: "Rock paper scissors" },
      { t: 10, title: "Connect Four with live chat" },
    ],
  },
];

/* ---------------------------------------------------------------------
   PROJECTS
   featured: true  -> big card in "Selected work"
   featured: false -> compact row in "Earlier work"
   wide: true      -> card spans two columns on large screens
   card / preview  -> optional image and short silent hover clip.
                      With no image, a generated cover is drawn.
   film            -> id from FILMS, adds a "Watch the film" button
   links           -> buttons in the case study (store pages, X, website)
   gallery         -> optional screenshots shown as thumbnails in the case study
   studio          -> the company you made it at
   --------------------------------------------------------------------- */
export const PROJECTS = [
  {
    id: "wahm",
    studio: "Dabbtech / 101-Dev NASTP, Karachi",
    featured: true,
    wide: true,
    title: "WAHM",
    native: "وهم",
    category: "Games",
    year: "2026",
    status: "In development",
    engine: "Unreal Engine 5.8",
    platform: "PC",
    tagline: "Before the poem made him a legend, he was a thief.",
    summary:
      "A third-person action and stealth game set in a sand-swept Arabian settlement, in a long development cycle at Dabbtech, where I lead it. Harith, an aimless thief, moves through the alleys, a crowded market and the rooftops above it, in a heist that ends where his story begins. Everything in the film is in-engine footage.",
    highlights: [
      "Motion-matched locomotion built on the Game Animation Sample (GASP)",
      "Authored traversal routes: sprint, vault, mantle and climb",
      "A crowd-dense market district to disappear into",
      "Rooftop routes that read their risk at a glance",
      "Volumetric dust and atmospheric haze",
      "Seamless GASP transitions between gameplay moments",
    ],
    tech: ["Unreal Engine 5.8", "GASP", "Motion Matching"],
    card: "assets/img/wahm-card.jpg",
    preview: "assets/video/wahm-preview.mp4",
    film: "wahm",
    links: [],
  },
  {
    id: "kingdomland",
    studio: "Dabbtech / 101-Dev NASTP, Karachi",
    featured: true,
    wide: true,
    title: "KingdomLand",
    native: "",
    category: "Real estate & maps",
    year: "",
    status: "Mobile app",
    engine: "Unreal Engine 5 and Unity",
    platform: "iOS and Android",
    tagline: "Riyadh, rebuilt as a living real estate world.",
    summary:
      "An interactive 3D real estate world generated from real Riyadh map data, where players buy, sell, rent, maintain and build on land. KingdomLand was built in Unity, Unreal Engine and React Native versions. I led it at Dabbtech and worked on the Unity and Unreal versions; the Unreal Engine version, shown in the film, is the flagship.",
    highlights: [
      "A real Riyadh map streamed with World Partition",
      "Object pooling for traffic and NPCs, with both static and walking NPCs",
      "Plots that react to players, and home construction on owned land",
      "The full plot lifecycle: buying, selling, renting and maintenance",
      "Everything synced across devices through an API-based backend",
    ],
    tech: ["Unreal Engine 5", "Unity", "World Partition", "Object pooling", "REST API backend", "Cross-device sync"],
    card: "assets/img/kingdomland-card.jpg",
    preview: "assets/video/kingdomland-preview.mp4",
    film: "kingdomland",
    links: [{ label: "Visit kingdomland.net", url: "https://kingdomland.net/" }],
  },
  {
    id: "apes-planet",
    studio: "ePAGING",
    featured: true,
    wide: true,
    title: "Apes Planet",
    native: "",
    category: "Metaverse & multiplayer",
    year: "2022–2025",
    status: "",
    engine: "Unreal Engine 4.27",
    platform: "PC",
    tagline: "A multiplayer metaverse with a fighting game, racing and boss raids inside it.",
    summary:
      "A multiplayer metaverse hub I led at ePAGING, with its own economy, creator SDK and a set of multiplayer games inside the world. The main world runs on a listen server while dedicated servers host the mini-games.",
    highlights: [
      "A Tekken-style fighting game with combos",
      "A racing mini-game, an obstacle-jump run and MMO-style boss fights",
      "Every mode multiplayer: listen server for the world, dedicated servers for mini-games",
      "Creator SDK for user-generated content",
      "In-game shops, currency, a proprietary coin and an in-game exchange",
      "ChatGPT-driven characters, level streaming and culling for performance",
    ],
    tech: ["Unreal Engine 4.27", "Replication", "Dedicated servers", "GameLift", "Node.js backend", "Web3"],
    card: "assets/img/apes-planet-card.jpg",
    preview: "assets/video/apes-planet-preview.mp4",
    film: "apes-planet",
    links: [
      { label: "Apes Planet on X", url: "https://x.com/ApesPlanetMeta" },
      { label: "Visit apesplanet.com", url: "https://www.apesplanet.com" },
    ],
  },
  {
    id: "grand-gangsta-city",
    studio: "Viral Vind Technologies",
    featured: true,
    wide: true,
    title: "Grand Gangsta City",
    native: "",
    category: "Games",
    year: "2024–2026",
    status: "",
    engine: "Unreal Engine 5, Lyra",
    platform: "iOS and Android",
    tagline: "An open-world crime city with crowds, crashes and NPCs that talk back.",
    summary:
      "A large urban open world with crime, racing and mission gameplay, built at Viral Vind Technologies. I worked across its systems, from the Lyra gameplay architecture to vehicles, crowds and AI-driven characters.",
    highlights: [
      "Modular open-world gameplay on the Lyra framework, including missions",
      "Real-time car deformation and vehicle damage",
      "MetaHuman crowds in the style of Epic's City Sample",
      "NPC speech with NVIDIA ACE text to speech",
      "Experiments with a different LLM per NPC to give each its own behaviour",
      "Multiplayer replication, economy and live ops",
    ],
    tech: ["Lyra", "Mass Entity", "City Sample", "MetaHumans", "NVIDIA ACE", "Replication"],
    accent: "#B5532A",
    card: "assets/img/ggc-card.jpg",
    preview: "assets/video/ggc-preview.mp4",
    film: "ggc",
    links: [{ label: "Grand Gangsta City on X", url: "https://x.com/grandgangstaci" }],
  },
  {
    id: "beegames",
    studio: "ePAGING",
    featured: true,
    title: "BeeGames",
    native: "",
    category: "Games",
    year: "2022–2024",
    status: "",
    engine: "Unity",
    platform: "WebGL",
    tagline: "Three real-time multiplayer games that run in the browser.",
    summary:
      "BeeGames, also known as BeeCasino, is a set of multiplayer WebGL games built in Unity at ePAGING: Connect Four, rock paper scissors and a dice game.",
    highlights: [
      "Connect Four with live in-game chat",
      "Rock paper scissors with jackpot rounds",
      "A multiplayer dice game",
      "Everything runs in the browser through Unity WebGL",
    ],
    tech: ["Unity", "WebGL", "Multiplayer"],
    card: "assets/img/beegames-card.jpg",
    preview: "assets/video/beegames-preview.mp4",
    film: "beegames",
    links: [{ label: "BeeGames on X", url: "https://x.com/BeeGamesPro" }],
  },
  {
    id: "crazy-battle",
    studio: "ePAGING",
    featured: true,
    title: "Crazy Battle",
    native: "",
    category: "Games",
    year: "2022–2024",
    status: "",
    engine: "Unity",
    platform: "",
    tagline: "Armed toy cars, a giant indoor arena, and real-time PvP.",
    summary:
      "A multiplayer PvP vehicle combat game built in Unity with Photon at ePAGING: armed toy cars battle across a giant indoor arena, with rewards for winning. Released as an NFT game on the Polygon network.",
    highlights: [
      "Real-time PvP car combat over Photon multiplayer",
      "Armed toy cars, projectiles and explosive hits",
      "A reward system for winning battles",
      "NFT game on the Polygon network",
    ],
    tech: ["Unity", "Photon", "Polygon"],
    accent: "#7A4FA0",
    card: "assets/img/crazy-battle-card.jpg",
    preview: "assets/video/crazy-battle-preview.mp4",
    links: [{ label: "Crazy Battle on X", url: "https://x.com/crazybattleNFT" }],
  },
  {
    id: "kick-arena",
    studio: "Dabbtech / 101-Dev NASTP, Karachi",
    featured: true,
    title: "Kick Arena",
    native: "",
    category: "Games",
    year: "",
    status: "Live on Google Play",
    engine: "Unity",
    platform: "Android",
    tagline: "Bend free kicks past the wall and the keeper, in stadiums from floodlit arenas to frozen ice.",
    summary:
      "A football shooting game built in Unity and live on Google Play. Players curl free kicks around the wall and past the goalkeeper, hit target challenges and level up through themed stadiums. I led the project at Dabbtech.",
    highlights: [
      "Free kicks and curling shots past a defensive wall and the goalkeeper",
      "Target challenges across themed stadiums, including a frozen ice arena",
      "Player levels and XP, with coins and gems",
      "Player customisation: shirts, trousers, shoes, suits and hairstyles",
      "A lucky spin with rewarded ads and a premium super spin",
    ],
    tech: ["Unity", "Google Play", "Rewarded ads", "In-app purchases"],
    accent: "#3F8F86",
    card: "assets/img/kick-arena-card.jpg",
    gallery: [
      "assets/img/kick-arena-stadium.jpg",
      "assets/img/kick-arena-ice.jpg",
      "assets/img/kick-arena-customize.jpg",
      "assets/img/kick-arena-spin.jpg",
    ],
    links: [{ label: "Get it on Google Play", url: "https://play.google.com/store/apps/details?id=com.kick.arena&hl=en" }],
  },
  {
    id: "tamr-farm",
    studio: "Dabbtech / 101-Dev NASTP, Karachi",
    featured: true,
    title: "Tamr Farm",
    native: "",
    category: "Games",
    year: "",
    status: "Live on Google Play",
    engine: "Unity",
    platform: "Android",
    tagline: "Build a Saudi date farm, raise its animals and deliver every order on time.",
    summary:
      "A farming game rooted in Saudi farming culture, built in Unity and live on Google Play. Players grow date palms and crops, raise camels and chickens, and build out their farm with friends. I led the project at Dabbtech.",
    highlights: [
      "Date palms, crops and a water tank that keeps the farm growing",
      "Camels and chickens to care for as farm breeds",
      "A build menu of farm buildings that unlock with level: farmhouse, silos, barn, feed mill, bakery, dairy, well",
      "An order board of timed deliveries for coins and experience",
      "Friends, helpers and followers, plus tasks, a spin wheel, leaderboard and daily rewards",
      "Three currencies: coins, gems and water",
    ],
    tech: ["Unity", "Google Play"],
    accent: "#6E8B3D",
    card: "assets/img/tamr-farm-card.jpg",
    gallery: [
      "assets/img/tamr-farm-culture.jpg",
      "assets/img/tamr-farm-breeds.jpg",
      "assets/img/tamr-farm-water.jpg",
      "assets/img/tamr-farm-build.jpg",
      "assets/img/tamr-farm-orders.jpg",
      "assets/img/tamr-farm-friends.jpg",
    ],
    links: [{ label: "Get it on Google Play", url: "https://play.google.com/store/apps/details?id=com.tamr.farmgame&hl=en" }],
  },
  {
    id: "westland-gangsta",
    studio: "Viral Vind Technologies",
    featured: true,
    title: "Westland Gangsta",
    native: "",
    category: "Games",
    year: "",
    status: "Live on Google Play",
    engine: "Unity",
    platform: "Android",
    tagline: "Grow your gang, mow down the horde, rebuild the town.",
    summary:
      "A mobile crowd shooter built in Unity at Viral Vind Technologies. Players grow a gang through number gates, fight zombie hordes and giant bosses down city streets, then rebuild their base between levels.",
    highlights: [
      "Crowd combat: a whole gang firing at once, with per-unit health",
      "Number gates that grow or shrink your crowd mid-run",
      "Zombie hordes and giant boss fights",
      "A level map with story characters between missions",
      "Base building with coins, wood, iron and food",
    ],
    tech: ["Unity", "Google Play"],
    accent: "#8A5A2B",
    card: "assets/img/westland-gangsta-card.jpg",
    gallery: [
      "assets/img/westland-gangsta-horde.jpg",
      "assets/img/westland-gangsta-boss.jpg",
      "assets/img/westland-gangsta-levels.jpg",
      "assets/img/westland-gangsta-base.jpg",
    ],
    links: [{ label: "Get it on Google Play", url: "https://play.google.com/store/apps/details?id=com.vvstudios.westlandgangsta" }],
  },
  {
    id: "caravan-of-the-sands",
    featured: true,
    title: "Caravan of the Sands",
    native: "",
    category: "Games",
    year: "",
    status: "In development",
    engine: "Unreal Engine 5",
    platform: "PC, Steam Early Access",
    tagline: "Breed camels, run a waystation, and cross a desert full of folklore.",
    summary:
      "A desert-fantasy PC game built around camel breeding, waystation ownership and Arabian folklore, heading for Steam Early Access.",
    highlights: [
      "Camel breeding as the core progression loop",
      "Own and grow a waystation on the caravan routes",
      "A world drawn from Arabian folklore",
    ],
    tech: ["Unreal Engine 5"],
    accent: "#C08A3E",
    links: [],
  },

  /* ---- Earlier work (featured: false) ---- */
  {
    id: "portal-puzzle",
    studio: "Lambda GameWorks",
    featured: false,
    title: "Portal puzzle game",
    category: "Games",
    year: "2022",
    engine: "",
    platform: "PC",
    tagline: "Portals, bridges and puzzles.",
    summary: "A portal-based 3D puzzle game at Lambda GameWorks: I built the portal, bridge and puzzle logic.",
    highlights: [],
    tech: [],
    links: [],
  },
  {
    id: "vr-heritage",
    studio: "Bits Collision",
    featured: false,
    title: "VR cultural heritage",
    category: "VR",
    year: "2022",
    engine: "",
    platform: "VR",
    tagline: "Walk through cultural heritage sites in VR.",
    summary:
      "My final-year project with Bits Collision: a VR simulation of cultural heritage sites that plays any stitched 360° video, with interactive features built on top.",
    highlights: [],
    tech: ["VR", "360° video"],
    links: [],
  },
];

/* ---------------------------------------------------------------------
   SYSTEMS — the rings of the 3D astrolabe (keep it to 4–7 rings).
   `proof` lists PROJECTS ids that show this skill in action.
   --------------------------------------------------------------------- */
export const SYSTEMS = [
  {
    name: "Gameplay architecture",
    summary: "Modular gameplay that a whole team can extend without breaking each other's work.",
    items: ["Lyra", "Gameplay Ability System", "GASP locomotion", "Enhanced Input", "Mission systems"],
    proof: ["kingdomland", "grand-gangsta-city", "wahm", "apes-planet"],
  },
  {
    name: "Multiplayer and live ops",
    summary: "Networked worlds that stay consistent across devices, and the economies that run inside them.",
    items: ["Replication", "Listen and dedicated servers", "Photon", "GameLift", "In-game economies", "Store live ops"],
    proof: ["apes-planet", "kingdomland", "crazy-battle", "beegames"],
  },
  {
    name: "Open worlds at scale",
    summary: "Big cities that stream in smoothly and stay fast on mid-range hardware.",
    items: ["World Partition", "Level streaming and culling", "Mass Entity", "City Sample", "Object pooling"],
    proof: ["grand-gangsta-city", "kingdomland"],
  },
  {
    name: "AI characters",
    summary: "NPCs that listen, answer and know what mission you're on.",
    items: ["NVIDIA ACE text to speech", "LLM-driven NPC behaviour", "ChatGPT integration", "Bots and boss AI"],
    proof: ["grand-gangsta-city", "apes-planet"],
  },
  {
    name: "Physics and destruction",
    summary: "Things that break believably, on phones as well as PCs.",
    items: ["Car deformation", "Procedural fracture", "Vehicle damage pipelines", "Physics optimisation"],
    proof: ["grand-gangsta-city"],
  },
  {
    name: "Unity and mobile",
    summary: "Unity games shipped to phones and browsers, plus engine-level work when the defaults aren't fast enough.",
    items: ["Photon multiplayer", "WebGL", "Google Play releases", "Custom ECS", "URP RenderGraph"],
    proof: ["kick-arena", "tamr-farm", "westland-gangsta", "crazy-battle", "beegames"],
  },
];

/* ---------------------------------------------------------------------
   EXPERIENCE — newest first.
   --------------------------------------------------------------------- */
export const EXPERIENCE = [
  {
    start: "2026",
    end: "Now",
    role: "Senior Game Developer and Project Lead",
    org: "Dabbtech / 101-Dev NASTP",
    note: "Karachi",
    url: "https://www.dabb.co/",
    points: [
      "Leading WAHM and KingdomLand in Unreal Engine 5, and Kick Arena and Tamr Farm in Unity",
      "Hands-on development plus day-to-day guidance for developers and designers",
    ],
  },
  {
    start: "2024",
    end: "2026",
    role: "Senior Game Developer",
    org: "Viral Vind Technologies",
    note: "Grand Gangsta City",
    points: [
      "Architected modular open-world gameplay and missions on UE5 Lyra",
      "Built car deformation and MetaHuman crowds in the style of City Sample",
      "Gave NPCs a voice with NVIDIA ACE text to speech, and experimented with a different LLM per NPC behaviour",
      "Led replication, economy and live ops",
      "Developed Westland Gangsta, a Unity crowd shooter live on Google Play",
    ],
  },
  {
    start: "2022",
    end: "2025",
    role: "Senior Game Developer",
    org: "Apes Planet Meta",
    note: "United Kingdom",
    points: ["Senior developer on the Apes Planet metaverse in Unreal Engine"],
  },
  {
    start: "2022",
    end: "2024",
    role: "Team Lead, Game Design and Development",
    org: "ePAGING",
    note: "Joined as Unreal developer in January 2022, senior that August, team lead that November",
    points: [
      "Led developers, designers, level designers, blockchain and Node.js backend engineers",
      "Built the Apes Planet multiplayer modes in Unreal Engine 4.27: a fighting game, racing, an obstacle run and MMO-style fights",
      "Designed the hybrid listen and dedicated server setup, the creator SDK and the in-game economy",
      "Shipped Unity titles Crazy Battle (Photon multiplayer) and BeeGames (WebGL multiplayer)",
    ],
  },
  {
    start: "2021",
    end: "2022",
    role: "Game Developer and Software Engineer",
    org: "Lambda GameWorks, Bits Collision",
    note: "",
    points: ["Portal and puzzle logic for a 3D puzzle game", "VR cultural heritage simulation with 360° video"],
  },
  {
    start: "2021",
    end: "2022",
    role: "Software Developer",
    org: "Tecizeverything, Pakistan Navy NRDI, GAOTek",
    note: ".NET Core APIs, Amazon MWS integrations, R&D and internships",
    points: [],
  },
  {
    start: "2018",
    end: "2022",
    role: "BE Computer Software Engineering",
    org: "Bahria University",
    note: "",
    points: [],
  },
];
