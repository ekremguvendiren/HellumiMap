export const DISTRICTS = [
    {
        id: 'lefkosa',
        name: 'Lefkoşa',
        center: { latitude: 35.1856, longitude: 33.3823 },
        radius: 8000,
        color: 'rgba(239, 68, 68, 0.2)', // Red tint
    },
    {
        id: 'girne',
        name: 'Girne',
        center: { latitude: 35.3364, longitude: 33.3182 },
        radius: 7000,
        color: 'rgba(59, 130, 246, 0.2)', // Blue tint
    },
    {
        id: 'magusa',
        name: 'Mağusa',
        center: { latitude: 35.1264, longitude: 33.9389 },
        radius: 9000,
        color: 'rgba(16, 185, 129, 0.2)', // Green tint
    },
    {
        id: 'guzelyurt',
        name: 'Güzelyurt',
        center: { latitude: 35.1978, longitude: 32.9934 },
        radius: 6000,
        color: 'rgba(245, 158, 11, 0.2)', // Orange tint
    },
    {
        id: 'iskele',
        name: 'İskele',
        center: { latitude: 35.2903, longitude: 33.8892 },
        radius: 7000,
        color: 'rgba(139, 92, 246, 0.2)', // Purple tint
    },
    {
        id: 'lefke',
        name: 'Lefke',
        center: { latitude: 35.1167, longitude: 32.8466 },
        radius: 5000,
        color: 'rgba(236, 72, 153, 0.2)', // Pink tint
    },
    {
        id: 'south',
        name: 'South Cyprus',
        center: { latitude: 34.9000, longitude: 33.3000 },
        radius: 15000, // Large radius to cover visible south
        color: 'rgba(107, 114, 128, 0.1)', // Gray tint
    }
];

export const CHECKPOINTS = [
    {
        id: 'metehan',
        name: 'Metehan (Agios Dometios)',
        coordinate: { latitude: 35.1762, longitude: 33.3235 },
        type: 'CAR',
        emoji: '🛂'
    },
    {
        id: 'ledra_palace',
        name: 'Ledra Palace',
        coordinate: { latitude: 35.1782, longitude: 33.3546 },
        type: 'PEDESTRIAN',
        emoji: '🛂'
    },
    {
        id: 'lokmaci',
        name: 'Ledra Street (Lokmacı)',
        coordinate: { latitude: 35.1744, longitude: 33.3614 },
        type: 'PEDESTRIAN',
        emoji: '🛂'
    },
    {
        id: 'beyarmudu',
        name: 'Beyarmudu (Pergamos)',
        coordinate: { latitude: 35.0485, longitude: 33.7085 },
        type: 'CAR',
        emoji: '🛂'
    },
    {
        id: 'akyar',
        name: 'Akyar (Strovilia)',
        coordinate: { latitude: 35.1165, longitude: 33.9115 },
        type: 'CAR',
        emoji: '🛂'
    },
    {
        id: 'bostanci',
        name: 'Bostancı',
        coordinate: { latitude: 35.1520, longitude: 33.0290 },
        type: 'CAR',
        emoji: '🛂'
    },
    {
        id: 'yesilirmak',
        name: 'Yeşilırmak',
        coordinate: { latitude: 35.1510, longitude: 32.7310 },
        type: 'CAR',
        emoji: '🛂'
    }
];

export const UN_ZONES = [
    {
        id: 'nicosia_airport',
        name: 'Nicosia International Airport',
        coordinate: { latitude: 35.1500, longitude: 33.2771 },
        type: 'RESTRICTED',
        emoji: '🇺🇳'
    },
    {
        id: 'ledra_palace_un',
        name: 'Ledra Palace Hotel (UN)',
        coordinate: { latitude: 35.1780, longitude: 33.3550 },
        type: 'RESTRICTED',
        emoji: '🇺🇳'
    }
];
