/* =====================================================================
   SQUISHY ISLAND ECONOMY  ·  art/economy.js
   Every shop, collection, Gem, ad and unlock number, in one machine-readable place.
   The words that explain them are in guide.html (#economy, #gems, #daily, #collection,
   #ads, #progression), factory.html and gemmine.html: change both together.
   tools/export_data reads this file and writes game/data/economy.json.
   Not in here: house / fun-building level costs (art/kit.js, SQ.COSTS), rarity colours and
   trade values (art/kit.js, SQ.RARITY), each minigame's coin rule (its prototype / manifest).
   ===================================================================== */
(function () {
'use strict';
const SQ = window.SQ = window.SQ || {};
SQ.ECONOMY = {
  /* Factory boxes. odds in %, rarity C/U/R/E/L. factoryLevel = Factory level that unlocks the box. */
  boxes: {
    mystery: { price: 200, odds: { C: 55, U: 25, R: 13, E: 6, L: 1 }, factoryLevel: 1 },
    family: { price: 500, odds: { C: 55, U: 25, R: 13, E: 6, L: 1 }, factoryLevel: 3, pickFamily: true },
    golden: { price: 1000, odds: { C: 0, U: 50, R: 30, E: 16, L: 4 }, factoryLevel: 6 },
    ad: { price: 0, odds: { C: 55, U: 25, R: 13, E: 6, L: 1 }, factoryLevel: 1, perDay: 3 }
  },
  /* Rare guarantee: after this many boxes in a row with no Rare or better, the next one is Rare or better. */
  rareGuaranteeAfter: 9,
  /* 1 box in 50 is Sparkly anyway. */
  sparklyChance: 1 / 50,
  /* The very first box (in the tour) is free and always this squishy. */
  firstBox: 'gyoza',
  /* Spare Shelf: spares needed to go from level n to n+1 (levels 1-5; level 5 = Sparkly). */
  spareLevels: { C: [1, 2, 3, 4], U: [1, 2, 3, 4], R: [1, 1, 2, 2], E: [1, 1, 2, 2], L: [1, 1, 1, 1] },
  maxSquishyLevel: 5,
  /* Swapping a spare for Squish Stars. */
  starsPerSpare: { C: 5, U: 15, R: 40, E: 100, L: 300 },
  /* Gem Shop: any Legendary, and the two exclusives (art/factory.js, exclusives). Gems never buy anything random. */
  gemShop: { legendary: 300, exclusive: 500 },
  gemsEarned: { dailyChallenge: 3, weeklyStreak: 15, weeklyStreakDays: 5, achievementMin: 10, achievementMax: 25 },
  /* Gem Mine packs (real money, behind the grown-up gate). Same price per Gem for every pack; price is a placeholder. */
  gemPacks: [
    { id: 'gems_100', gems: 100 }, { id: 'gems_300', gems: 300 }, { id: 'gems_500', gems: 500 }, { id: 'gems_1000', gems: 1000 }
  ],
  gemPricePer100Eur: 0.99,
  /* Decor in a house adds Cozy points: every 5 Cozy gives that family's squishies +5% minigame coins (house pages). */
  cozy: { pointsPerStep: 5, coinBonusPerStep: 0.05 },
  /* Daily visits */
  daily: { coinQuests: 2, coinQuestReward: 40, firstRunMultiplier: 2, challengeOfBest: 0.9, visitorDays: 4 },
  /* Minigame payout rules shared by every game (each game's own coin rule lives with the game). */
  minigames: {
    coinsPerMinuteTarget: 35, milestoneBonus: [10, 25, 50],
    levelFirstClear: 30, levelReplay: 10, perStar: 15, everyTenthLevelMultiplier: 2,
    serverMaxCoinsPerMinute: 60
  },
  /* Ads: rewarded only, always opted into. */
  ads: { closableAfterSeconds: 5, keepGoingPerRun: 1, freeBoxesPerDay: 3 },
  /* The open island (guide.html#progression): everything is open from day one. "built" starts at level 1
     (three minigames, the Factory and the Gem Mine); every other fun building is an empty plot built with coins;
     houses start broken and are fixed up with coins. The list format can still hold later unlocks if ever needed:
     when: start | { house, level } | { owned } */
  unlocks: [
    { when: 'start', houses: ['dumpling', 'kitchen', 'pets', 'sweets', 'fruit', 'ocean', 'sky', 'forest'],
      buildings: ['playground', 'restaurant', 'post', 'factory', 'gemmine', 'market', 'salon', 'police', 'fire', 'testlab', 'arcade', 'bandstand', 'greenhouse'],
      built: ['playground', 'restaurant', 'post', 'factory', 'gemmine'], gift: 'bao' }
  ]
};
})();
