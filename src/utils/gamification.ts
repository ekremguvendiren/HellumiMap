// XP Threshold to level up: Level * Level * 500
// Level 1 -> 500 XP
// Level 2 -> 2000 XP
export const calculateNextLevelXp = (level: number) => {
    return level * level * 500;
};

// Building Cost: 300 * 1.2^(Level-1)
export const calculateBuildingCost = (currentLevel: number) => {
    const basePrice = 300;
    return Math.floor(basePrice * Math.pow(1.2, currentLevel - 1));
};

export const REWARDS = {
    REPORT_POLICE: 15,
    REPORT_RADAR: 15,
    REPORT_HAZARD: 15,
    REPORT_ACCIDENT: 20,
    BOT_DEFEAT: 50,
    HELLUMI_SPOT: 50,
};

export const COIN_REWARDS = {
    BOT_DEFEAT_MIN: 20,
    BOT_DEFEAT_MAX: 50,
    REPORT_CHANCE: 0.2, // 20%
    REPORT_MIN: 5,
    REPORT_MAX: 10,
    LEVEL_UP_BONUS: 1000,
};

export const TIERS = [
    { name: 'Traveler', minXp: 0, color: '#6B7280' }, // Gray
    { name: 'Local', minXp: 500, color: '#3B82F6' }, // Blue
    { name: 'Warden', minXp: 2000, color: '#10B981' }, // Green
    { name: 'Islander', minXp: 5000, color: '#F59E0B' }, // Amber
    { name: 'Hellumi Legend', minXp: 10000, color: '#EF4444' }, // Red
];

export const getTier = (xp: number) => {
    // Find highest tier where minXp <= xp
    return [...TIERS].reverse().find(t => xp >= t.minXp) || TIERS[0];
};

export const getTierProgress = (xp: number, level: number) => {
    // Progress relative to NEXT level threshold, not Tiers anymore
    const needs = calculateNextLevelXp(level);
    const prevNeeds = calculateNextLevelXp(level - 1);

    const range = needs - prevNeeds;
    const current = xp - prevNeeds;

    // Safety for Level 1
    if (level === 1) return Math.min(Math.round((xp / needs) * 100), 100);

    return Math.min(Math.round((current / range) * 100), 100);
};
