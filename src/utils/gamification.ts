// XP Threshold to level up: Level * 100
// Level 1 -> 100 XP -> Level 2
// Level 2 -> 200 XP -> Level 3 (Total accrued? No, usually cumulative in RPGs, but keep simple: Current Level * 100 to pass)
export const calculateNextLevelXp = (level: number) => level * 100;

export const REWARDS = {
    REPORT_POLICE: 15,
    REPORT_RADAR: 15,
    REPORT_HAZARD: 15,
    REPORT_ACCIDENT: 20,
    BOT_DEFEAT: 50,
};

export const COIN_REWARDS = {
    BOT_DEFEAT_MIN: 20,
    BOT_DEFEAT_MAX: 50,
    REPORT_CHANCE: 0.2, // 20%
    REPORT_MIN: 5,
    REPORT_MAX: 10,
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

export const getTierProgress = (xp: number) => {
    const currentTierIndex = TIERS.findIndex(t => t.name === getTier(xp).name);
    const nextTier = TIERS[currentTierIndex + 1];

    if (!nextTier) return 100; // Max level

    const currentTierXp = TIERS[currentTierIndex].minXp;
    const needed = nextTier.minXp - currentTierXp;
    const earned = xp - currentTierXp;

    return Math.min(Math.round((earned / needed) * 100), 100);
};
