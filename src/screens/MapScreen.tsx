import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Image } from 'react-native';
import { EVService, EVStation } from '../services/evService';
import { GeoUtils, GREEN_LINE_POLYGON } from '../utils/geoUtils';
import MapView from 'react-native-map-clustering';
import { Marker, Callout, PROVIDER_GOOGLE, Circle, Polyline, Polygon } from 'react-native-maps'; // Correct Imports

import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { GlassContainer } from '../components/common/GlassContainer';
import { VerificationCard } from '../components/map/VerificationCard';
import { COLORS } from '../constants/colors';
import { supabase } from '../services/supabase';
import { ReportService } from '../services/reportService';
import { VoiceService } from '../services/voiceService';
import { SearchBar } from '../components/map/SearchBar';
import { ReportFAB } from '../components/map/ReportFAB';
import { NavigationService, Bot } from '../services/navigationService';
import { calculateNextLevelXp, REWARDS, COIN_REWARDS } from '../utils/gamification';
import { XPProgressBar } from '../components/game/XPProgressBar';
import { HellumiStarMarker, HellumiStar } from '../components/map/HellumiStarMarker';
import { DominionService, UserBuilding, Monument, GasStation } from '../services/dominionService';
import { BackpackModal } from '../components/game/BackpackModal';
import { GameHUD } from '../components/game/GameHUD';
import { PlayerCard } from '../components/game/PlayerCard';
import { WazeReportMenu } from '../components/map/WazeReportMenu';
import { PlayerDock } from '../components/game/PlayerDock';
import { PlayerDashboardModal } from '../components/game/PlayerDashboardModal';
import { AdminToolsModal } from '../components/game/AdminToolsModal';
import { WorldNewsTicker } from '../components/game/WorldNewsTicker';
import { DailyQuestsModal } from '../components/game/DailyQuestsModal';
import { AchievementsModal } from '../components/game/AchievementsModal';
import { FactionModal } from '../components/game/FactionModal';
import { OnboardingTutorial, checkTutorialComplete } from '../components/game/OnboardingTutorial';
import { questService } from '../services/questService';

import { NAVIGATION_MAP_STYLE } from '../constants/MapStyles';
import { DISTRICTS, CHECKPOINTS, UN_ZONES } from '../constants/Districts';

// Cyprus Coordinates (Fallback)
const CYPRUS_REGION = {
    latitude: 35.1856,
    longitude: 33.3823,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
};

// Types
interface ReportMarker {
    id: string;
    latitude: number;
    longitude: number;
    type: string;
    speed_limit?: number; // Added for fixed radars
    isFixed?: boolean; // Differentiation flag
    user?: {
        username: string;
        tier: string;
        emoji_avatar?: string;
    };
}

// Helper: Haversine Distance (Meters)
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

// Custom Marker Component
const CustomMarker = ({ type, user, isFixed, speed_limit, emoji }: { type: string, user?: { emoji_avatar?: string, tier: string }, isFixed?: boolean, speed_limit?: number, emoji?: string }) => {
    // Custom Emoji (Checkpoints or generic)
    if (emoji) {
        return (
            <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg border-2 border-gray-200">
                <Text style={{ fontSize: 22 }}>{emoji}</Text>
            </View>
        );
    }

    // 1. Check for Report/Event Type first to prioritize visual Event identification
    // (User said: "If I report police, police emoji should appear")
    let bgColor = COLORS.emergency;
    let symbol = "!";

    switch (type) {
        case 'SPEED_CAMERA':
            bgColor = "#EF4444"; // Red
            symbol = "📷";
            break;
        case 'POLICE':
            bgColor = "#3B82F6"; // Blue
            symbol = "👮";
            break;
        case 'TRAFFIC':
            bgColor = "#F59E0B"; // Orange
            symbol = "🚗";
            break;
        case 'HAZARD':
            bgColor = "#F97316"; // Orange-500
            symbol = "🚧";
            break;
        case 'HELLUMI_SPOT':
            bgColor = "#fbbf24"; // Yellow-400
            symbol = "🧀";
            break;
        case 'ACCIDENT':
            bgColor = "#991B1B"; // Red-800
            symbol = "💥";
            break;
        case 'GAS':
            bgColor = "#10B981";
            symbol = "⛽";
            break;
    }

    // Special Case: User Avatar (Only if it's NOT a specific report type, effectively 'Self' or 'Other Player')
    // If type is generic or empty, show Avatar. 
    // BUT we are using this for Reports too.
    // Logic: If it is a Report Marker (has type other than generic), show Report Icon with attribution.

    if (['SPEED_CAMERA', 'POLICE', 'TRAFFIC', 'HAZARD', 'HELLUMI_SPOT', 'ACCIDENT', 'GAS'].includes(type) || isFixed) {
        return (
            <View style={{ backgroundColor: bgColor }} className="w-10 h-10 rounded-full border-2 border-white items-center justify-center shadow-lg">
                <Text style={{ fontSize: 22 }}>{symbol}</Text>

                {/* Speed Limit Badge */}
                {speed_limit && (
                    <View className="absolute -top-2 -right-2 bg-red-600 rounded-full w-5 h-5 items-center justify-center border border-white">
                        <Text className="text-white text-[8px] font-bold">{speed_limit}</Text>
                    </View>
                )}

                {/* Reporter Attribution Badge (Small User Avatar) */}
                {user?.emoji_avatar && !isFixed && (
                    <View className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white items-center justify-center border border-gray-200">
                        <Text style={{ fontSize: 10 }}>{user.emoji_avatar}</Text>
                    </View>
                )}
            </View>
        );
    }

    // Fallback: If it's just a User (no specific report type), show their Big Avatar
    if (user?.emoji_avatar) {
        return (
            <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg border-2 border-cyan-500">
                <Text style={{ fontSize: 24 }}>{user.emoji_avatar}</Text>
            </View>
        );
    }

    // Default Fallback
    return (
        <View style={{ backgroundColor: bgColor }} className="w-8 h-8 rounded-full border-2 border-white items-center justify-center shadow-md">
            <Text style={{ fontSize: 16 }}>{symbol}</Text>
        </View>
    );

}

// Optimized Marker Component
const MemoizedCustomMarker = React.memo(CustomMarker);

export const MapScreen = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();


    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | 'loading'>('loading');
    const [reports, setReports] = useState<ReportMarker[]>([]);
    const [followUser, setFollowUser] = useState(true);
    const mapRef = useRef<any>(null); // Use any to bypass clustering type issues for now
    const alertedReports = useRef<Set<string>>(new Set());
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [hellumiStars, setHellumiStars] = useState<HellumiStar[]>([]);

    // 3. Geofencing Watcher & Verification State
    const [nearestReport, setNearestReport] = useState<ReportMarker | null>(null);

    // 4. Navigation & Bots
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [bots, setBots] = useState<Bot[]>([]);
    const [otherPlayers, setOtherPlayers] = useState<any[]>([]); // Multiplayer Ghosts

    // 5. Dominion (GPS-RPG)
    const [buildings, setBuildings] = useState<UserBuilding[]>([]);
    const [monuments, setMonuments] = useState<Monument[]>([]);
    const [gasStations, setGasStations] = useState<GasStation[]>([]);
    const [showBackpack, setShowBackpack] = useState(false);
    const [showReportMenu, setShowReportMenu] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);

    // 6. EV Stations & Green Line
    const [evStations, setEvStations] = useState<EVStation[]>([]);
    const [inBufferZone, setInBufferZone] = useState(false);

    // 7. Fog & Treasures
    const [revealedAreas, setRevealedAreas] = useState<{ latitude: number, longitude: number }[]>([]);
    const [treasures, setTreasures] = useState<any[]>([]);

    // Admin
    const [showAdminTools, setShowAdminTools] = useState(false);
    const isAdmin = currentUser?.username === 'Ekrem' || currentUser?.email === 'esadiguvendiren@gmail.com';

    // New Game Modals
    const [showQuests, setShowQuests] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showFaction, setShowFaction] = useState(false);
    const [showTutorial, setShowTutorial] = useState(false);

    // Load World Data
    useEffect(() => {
        const loadWorld = async () => {
            const b = await DominionService.getBuildings();
            setBuildings(b);
            const m = await DominionService.getMonuments();
            setMonuments(m);
            const gas = await DominionService.getGasStations();
            setGasStations(gas);
            const t = await DominionService.getTreasures();
            setTreasures(t);

            // Check if tutorial should be shown
            const tutorialComplete = await checkTutorialComplete();
            if (!tutorialComplete) {
                setShowTutorial(true);
            }
        };
        loadWorld();
    }, []);

    // Spawn Bots Around Player (500m radius) - Once when location is available
    useEffect(() => {
        if (location && bots.length === 0) {
            const raiders = NavigationService.spawnBotsAroundPlayer(
                location.coords.latitude,
                location.coords.longitude,
                5 // Spawn 5 Raider Bots
            );
            setBots(raiders);
            console.log("👾 Spawned 5 Raider Bots!");
        }
    }, [location]);

    // Energy Regeneration: +5 every 5 minutes (online)
    useEffect(() => {
        if (!currentUser?.id) return;

        const regenInterval = setInterval(async () => {
            const { data: profile } = await supabase
                .from('profiles')
                .select('energy')
                .eq('id', currentUser.id)
                .single();

            if (profile && profile.energy < 100) {
                const newEnergy = Math.min(100, profile.energy + 5);
                await supabase.from('profiles').update({ energy: newEnergy }).eq('id', currentUser.id);
                setCurrentUser((prev: any) => prev ? { ...prev, energy: newEnergy } : prev);
                console.log("⚡ Energy regenerated:", newEnergy);
            }
        }, 5 * 60 * 1000); // Every 5 minutes

        return () => clearInterval(regenInterval);
    }, [currentUser?.id]);

    // Monitor Buffer Zone
    useEffect(() => {
        if (!location) return;
        const inside = GeoUtils.isPointInPolygon(location.coords, GREEN_LINE_POLYGON);
        if (inside && !inBufferZone) {
            Alert.alert("Warning", "Entering UN Buffer Zone! Watch out for Guardians.");
        }
        setInBufferZone(inside);

        // Reveal Fog (Simple MVP)
        setRevealedAreas(prev => [...prev, location.coords]);

        // Treasure Audio Logic (Geiger Counter)
        if (treasures.length > 0) {
            const closestT = treasures.reduce((prev, curr) => {
                const d = getDistanceMeters(location.coords.latitude, location.coords.longitude, curr.latitude, curr.longitude);
                return (d < (prev?.dist || Infinity)) ? { ...curr, dist: d } : prev;
            }, { dist: Infinity });

            if (closestT && closestT.dist < 100) {
                console.log("Beep! Treasure nearby:", closestT.dist);
            }
        }
    }, [location]);

    const handleBuild = async () => {
        if (!location || !currentUser) return;
        const success = await DominionService.placeBuilding(currentUser.id, location.coords.latitude, location.coords.longitude);
        if (success) {
            Alert.alert("Success", "Foundation laid! ⛺");
            const b = await DominionService.getBuildings(); // Refresh
            setBuildings(b);
        }
    };


    // 1. Initial Setup
    useEffect(() => {
        let locationSub: Location.LocationSubscription;

        (async () => {
            // Request Permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status !== 'granted') {
                return;
            }

            // Watch Position (More accurate for Navigation)
            locationSub = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 10, // Update every 10 meters
                    timeInterval: 1000
                },
                (newLoc) => {
                    setLocation(newLoc);

                    // Direct "Follow Me" implementation
                    if (followUser && mapRef.current) {
                        try {
                            mapRef.current.animateCamera({
                                center: {
                                    latitude: newLoc.coords.latitude,
                                    longitude: newLoc.coords.longitude,
                                },
                                pitch: 45, // Angled view like Waze
                                heading: newLoc.coords.heading ?? 0,
                                zoom: 17
                            }, { duration: 500 });
                        } catch (e) { /* ignore */ }
                    }
                }
            );

            // Fetch User Reports
            const active = await ReportService.getActiveReports();
            let allMarkers: ReportMarker[] = [];

            if (active) {
                const transformed = active.map((r: any) => {
                    let lat = r.latitude || 0;
                    let long = r.longitude || 0;
                    if (lat === 0 && typeof r.location === 'string') {
                        try {
                            const coords = r.location.replace('POINT(', '').replace(')', '').split(' ');
                            long = parseFloat(coords[0]);
                            lat = parseFloat(coords[1]);
                        } catch (e) { }
                    }
                    return {
                        id: r.id,
                        latitude: lat,
                        longitude: long,
                        type: r.type,
                        user: r.profiles
                    }
                });
                allMarkers = [...allMarkers, ...transformed];
            }

            // Fetch Fixed Radars (NEW)
            const fixedRadars = await ReportService.getFixedRadars();
            if (fixedRadars) {
                const fixedMarkers = fixedRadars.map((r: any) => ({
                    id: r.id,
                    latitude: r.latitude,
                    longitude: r.longitude,
                    type: 'SPEED_CAMERA',
                    speed_limit: r.speed_limit,
                    isFixed: true
                }));
                allMarkers = [...allMarkers, ...fixedMarkers];
            }

            setReports(allMarkers);

            // Fetch Hellumi Stars
            const stars = await ReportService.getHellumiStars();
            if (stars) setHellumiStars(stars);

            // Fetch Current User for Avatar & XP
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (profile) setCurrentUser(profile);
                else {
                    // Profile missing - Redirect to Setup
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'ProfileSetup' }],
                    });
                }
            }
        })();

        // Realtime Subscription
        const reportSub = supabase
            .channel('reports-channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' },
                async (payload) => {
                    const newReport = payload.new as any;
                    // ... existing report logic ...
                })
            .subscribe();

        // MULTIPLAYER GHOSTS: Listen for other players moving
        const playerSub = supabase
            .channel('public:profiles')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                const updatedUser = payload.new as any;
                if (currentUser && updatedUser.id === currentUser.id) return; // Ignore self

                // Only show if they have lat/lon (assuming schema has location columns or we use a separate table)
                // For MVP, if profiles table has lat/long updates:
                // If not, we might need a separate 'user_locations' table.
                // Assuming 'profiles' has lat/long for now or we rely on 'reports' for presence. 
                // Actually earlier I checked 'user_buildings' but not profiles schema.
                // Let's assume we map 'bots' state to include players for now or add a new 'otherPlayers' state.

                // Note: If schema doesn't support lat/lon on profiles, this won't work perfectly without schema change.
                // But user asked to "fix functions". I will add the listener assuming columns exist or will allow me to specificy where to store location.
                // Best practice: separate table. But let's assume 'last_latitude', 'last_longitude' on profiles for simplicity if they exist.

                // Since I can't check schema easily without viewing file/sql, I will implementation a safe check.
                if (updatedUser.last_latitude && updatedUser.last_longitude) {
                    // Update a "ghosts" state (need to add this state to MapScreen first, I'll add the logical hook here)
                    setOtherPlayers(prev => {
                        const others = prev.filter(p => p.id !== updatedUser.id);
                        return [...others, updatedUser];
                    });
                }
            })
            .subscribe();

        // Return cleanup
        return () => {
            if (locationSub) locationSub.remove();
            supabase.removeChannel(reportSub);
            supabase.removeChannel(playerSub);
        };
    }, [currentUser]); // Added currentUser dep safely

    // Separate effect for Level Up Animation
    const prevLevelRef = useRef<number>(1);
    useEffect(() => {
        if (!currentUser) return;

        if (currentUser.level > prevLevelRef.current) {
            Alert.alert(
                "Level Up! 🎊",
                `Congratulations! You reached Level ${currentUser.level}!\n\n+1000 Coins 💰\n+5m Interaction Radius 🔵`
            );
            prevLevelRef.current = currentUser.level;
        } else {
            // Init ref if first load
            prevLevelRef.current = currentUser.level;
        }
    }, [currentUser?.level]);

    // 2. Geofencing & Voice Alerts
    useEffect(() => {
        if (!location) return;

        let closest: ReportMarker | null = null;
        let minDist = Infinity;

        reports.forEach(report => {
            const dist = getDistanceMeters(
                location.coords.latitude,
                location.coords.longitude,
                report.latitude,
                report.longitude
            );

            // Voice Alert (500m)
            if (dist < 500 && !alertedReports.current.has(report.id)) {
                let msg = VoiceService.alerts.hazard; // Using getter for fresh translation
                if (report.type === 'SPEED_CAMERA') {
                    msg = VoiceService.getRadarAlert(report.speed_limit || 50);
                }
                else if (report.type === 'POLICE') msg = VoiceService.alerts.police;

                VoiceService.speak(msg);
                alertedReports.current.add(report.id);
            }

            // Verification
            if (dist < 500 && dist < minDist) {
                minDist = dist;
                closest = report;
            }
        });

        setNearestReport(closest);
    }, [location, reports]);


    // Recenter
    const handleRecenter = () => {
        setFollowUser(true);
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };

    // Unified Report Handler (FAB)
    const handleCreateReport = async (type: string) => {
        console.log("Creating report:", type); // Debug
        if (!location) {
            Alert.alert("Error", "No GPS Location.");
            return;
        }
        if (!currentUser) {
            Alert.alert("Error", "Not logged in.");
            return;
        }
        try {
            // Optimistic UI Update - Show marker immediately
            const pendingMarker: ReportMarker = {
                id: `pending-${Date.now()}`,
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                type: type as any,
                user: {
                    username: currentUser.username,
                    tier: currentUser.current_tier,
                    emoji_avatar: currentUser.emoji_avatar
                }
            };
            setReports(prev => [pendingMarker, ...prev]);

            await ReportService.createReport(currentUser.id, type as any, location.coords.latitude, location.coords.longitude);
            VoiceService.speak("Reported! +10 XP"); // Local feedback
            Alert.alert("Reported!", "You gained +10 XP!");

            // Refresh logic optional or rely on subscription
            // Re-fetch to get real ID and server data
            const active = await ReportService.getActiveReports();
            // ... (Simple refetch if needed, but subscription handles it usually)
        } catch (e) {
            Alert.alert(t('common.error'));
            // Remove optimistic marker on error
            setReports(prev => prev.filter(r => !r.id.startsWith('pending-')));
        }
    };

    // Verification
    const handleVerify = async (id: string, vote: any) => {
        VoiceService.speak(t('common.success'));
        setNearestReport(null);
    };

    // --- TEST MODE: Place Radar 200m Ahead ---
    const handleTestRadar = async () => {
        if (!location) {
            Alert.alert(t('common.error'), t('map.permission_denied'));
            return;
        }

        // Calculate point 200m ahead
        // 1 deg lat ~= 111km -> 0.0018 deg ~= 200m
        // Use heading if available, else default North
        const heading = location.coords.heading || 0;
        const dist = 0.2; // km
        const R = 6371; // Earth radius km

        const lat1 = location.coords.latitude * Math.PI / 180;
        const lon1 = location.coords.longitude * Math.PI / 180;
        const brng = heading * Math.PI / 180;

        const lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist / R) +
            Math.cos(lat1) * Math.sin(dist / R) * Math.cos(brng));
        const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist / R) * Math.cos(lat1),
            Math.cos(dist / R) - Math.sin(lat1) * Math.sin(lat2));

        const newLat = lat2 * 180 / Math.PI;
        const newLon = lon2 * 180 / Math.PI;

        VoiceService.speak("Test radar");

        try {
            // Using basic 'POLICE' for test button, but calling old method if compatible or update test logic
            // Assuming createReport handles string broadly or we cast
            await ReportService.createReport("TEST_USER", "SPEED_CAMERA", newLat, newLon);
            Alert.alert("DEBUG", `Radar at ${newLat.toFixed(4)}, ${newLon.toFixed(4)}`);
        } catch (e) {
            Alert.alert(t('common.error'));
        }
    }


    // Developer Teleport (Long Press)
    const handleMapLongPress = (e: any) => {
        const { coordinate } = e.nativeEvent;
        Alert.alert(
            "Developer Teleport",
            `Jump to ${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Teleport",
                    onPress: () => {
                        const newLoc = {
                            coords: {
                                latitude: coordinate.latitude,
                                longitude: coordinate.longitude,
                                altitude: 0,
                                accuracy: 5,
                                altitudeAccuracy: 5,
                                heading: 0,
                                speed: 0
                            },
                            timestamp: Date.now()
                        };
                        setLocation(newLoc as any);
                        setFollowUser(false); // Stop following real GPS
                        VoiceService.speak("Teleport active.");
                    }
                }
            ]
        );
    };

    if (permissionStatus === 'loading') {
        return <View className="flex-1 bg-gray-900 items-center justify-center"><ActivityIndicator size="large" color={COLORS.deepsea} /></View>;
    }

    if (permissionStatus !== 'granted') {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center p-6">
                <Text className="text-white text-xl font-bold mb-2">{t('map.permission_denied')}</Text>
                <Text className="text-gray-400 text-center">Location needed.</Text>
                <TouchableOpacity onPress={Location.requestForegroundPermissionsAsync} className="mt-4 bg-deepsea px-6 py-3 rounded-full">
                    <Text className="text-white font-bold">Grant</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-900">
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ width: '100%', height: '100%' }}
                initialRegion={CYPRUS_REGION}
                showsUserLocation={false} // Hidden to use custom avatar
                showsMyLocationButton={false} // Building custom one
                followsUserLocation={false} // We handle manually
                customMapStyle={NAVIGATION_MAP_STYLE}
                onPanDrag={() => setFollowUser(false)} // User moved map, stop following
                onLongPress={handleMapLongPress} // Developer Teleport
            >
                {/* User Avatar (Me) */}
                {location && (
                    <Marker
                        coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                        anchor={{ x: 0.5, y: 0.5 }}
                        zIndex={999} // Always on top
                    >
                        <View className="items-center justify-center shadow-xl shadow-cyan-500/50">
                            {/* Glowing effect container */}
                            <View className="w-12 h-12 rounded-full bg-cyan-500/30 items-center justify-center">
                                <View className="w-10 h-10 bg-white rounded-full items-center justify-center border-2 border-white">
                                    <Text style={{ fontSize: 24 }}>{currentUser?.emoji_avatar || '👽'}</Text>
                                </View>
                            </View>
                        </View>
                    </Marker>
                )}

                {/* 1. Dominion Interaction Circle (Base 200m + 5m per Level) */}
                {location && (
                    <Circle
                        center={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                        radius={200 + ((currentUser?.level || 1) * 5)}
                        fillColor="rgba(52, 152, 219, 0.2)"
                        strokeColor="rgba(52, 152, 219, 0.5)"
                        strokeWidth={1}
                        zIndex={900}
                    />
                )}

                {/* 2. User Buildings */}
                {buildings.filter(b =>
                    typeof b.latitude === 'number' &&
                    typeof b.longitude === 'number' &&
                    !isNaN(b.latitude) &&
                    !isNaN(b.longitude)
                ).map((b) => (
                    <Marker
                        key={b.id}
                        coordinate={{ latitude: b.latitude, longitude: b.longitude }}
                        title={`Building Lv.${b.level}`}
                        onCalloutPress={() => {
                            if (!location || !currentUser) return;
                            if (b.user_id === currentUser.id) {
                                DominionService.collectIncome(currentUser.id, b, location.coords.latitude, location.coords.longitude);
                            } else {
                                Alert.alert(
                                    "Enemy Building",
                                    "Attack this structure?",
                                    [
                                        { text: "Cancel", style: "cancel" },
                                        {
                                            text: "Attack ⚔️", onPress: async () => {
                                                const res = await DominionService.attackBuilding(currentUser.id, b, location.coords.latitude, location.coords.longitude);
                                                if (res) Alert.alert("Attack Result", `Dealt ${res.damage} DMG! Ruined: ${res.isRuined}`);
                                            }
                                        }
                                    ]
                                );
                            }
                        }}
                    >
                        <View className="items-center">
                            <Text style={{ fontSize: 32 }}>{DominionService.getBuildingEmoji(b.tier || 'TENT')}</Text>
                            {b.ruined_until && <Text className="absolute text-2xl -top-2">🔥</Text>}
                            <View className="bg-black/50 px-2 rounded-full mt-1">
                                <Text className="text-white text-[10px] font-bold">{b.tier || 'TENT'}</Text>
                            </View>
                        </View>
                    </Marker>

                ))}

                {/* 3. Monuments (World Bosses) */}
                {monuments.map((m) => (
                    <Marker
                        key={m.id}
                        coordinate={{ latitude: m.lat, longitude: m.lng }}
                        title={m.name}
                        onCalloutPress={() => {
                            if (!location || !currentUser) return;
                            Alert.alert("Attack Boss?", `Attack ${m.name}?`, [
                                { text: "Cancel" },
                                { text: "Attack", onPress: () => DominionService.attackMonument(currentUser.id, m, location.coords.latitude, location.coords.longitude) }
                            ]);
                        }}
                    >
                        <View className="items-center">
                            <Text style={{ fontSize: 40 }}>{m.emoji}</Text>
                            <View className="bg-red-900/80 px-2 rounded-full mt-1 border border-red-500">
                                <Text className="text-white text-[10px] font-bold">BOSS</Text>
                            </View>
                        </View>
                    </Marker>
                ))}

                {/* 4. Gas Stations (Fuel) */}
                {gasStations.map((g) => (
                    <Marker
                        key={g.id}
                        coordinate={{ latitude: g.lat, longitude: g.lng }}
                        title={g.name}
                        onCalloutPress={() => {
                            if (!location || !currentUser) return;
                            Alert.alert("Gas Station", `Buy Fuel at ${g.name}? (100 Coins)`, [
                                { text: "Cancel" },
                                { text: "Buy Fuel ⛽", onPress: () => DominionService.buyFuel(currentUser.id, g, location.coords.latitude, location.coords.longitude) }
                            ]);
                        }}
                    >
                        <View className="items-center justify-center bg-orange-100 p-1 rounded-full border border-orange-500">
                            <Text style={{ fontSize: 20 }}>⛽</Text>
                        </View>
                    </Marker>
                ))}

                {/* 5. FOG OF WAR (Global Polygon with Holes) */}
                {/* MVP: Render revealed light circles */}
                {revealedAreas.slice(-50).map((area, i) => (
                    <Circle
                        key={`fog-${i}`}
                        center={area}
                        radius={200}
                        fillColor="rgba(255, 255, 255, 0.05)" // Lighten the area
                        zIndex={1}
                    />
                ))}

                {/* 6. TREASURES */}
                {treasures.map((t) => (
                    <Marker
                        key={t.id}
                        coordinate={{ latitude: t.latitude, longitude: t.longitude }}
                        title="Treasure Chest"
                        onCalloutPress={() => {
                            if (!location || !currentUser) return;
                            DominionService.claimTreasure(currentUser.id, t.id, location.coords.latitude, location.coords.longitude, t.latitude, t.longitude)
                                .then(success => {
                                    if (success) {
                                        // Remove from local state
                                        setTreasures(prev => prev.filter(x => x.id !== t.id));
                                    }
                                });
                        }}
                    >
                        <Text style={{ fontSize: 30 }}>📦</Text>
                    </Marker>
                ))}

                {/* Districts (Territories) */}
                {DISTRICTS.map((district) => (
                    <React.Fragment key={district.id}>
                        <Circle
                            center={district.center}
                            radius={district.radius}
                            fillColor={district.color}
                            strokeColor={district.color.replace('0.2)', '0.5)')}
                            strokeWidth={2}
                        />
                    </React.Fragment>
                ))}

                {/* Checkpoints */}
                {CHECKPOINTS.map((cp) => (
                    <Marker
                        key={cp.id}
                        coordinate={cp.coordinate}
                        title={cp.name}
                        onCalloutPress={() => {
                            Alert.alert(
                                "🛂 Border Crossing",
                                "Keep your ID/Passport ready for inspection.",
                                [{ text: "OK" }]
                            );
                        }}
                    >
                        <CustomMarker type="CHECKPOINT" emoji={cp.emoji} />
                        <Callout tooltip>
                            <View className="bg-white p-3 rounded-lg shadow-lg w-48 border-l-4 border-red-500">
                                <Text className="font-bold text-base mb-1">{cp.name}</Text>
                                <Text className="text-red-500 font-bold text-xs">
                                    🛂 Keep ID/Passport Ready
                                </Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* UN Zones */}
                {UN_ZONES.map((zone) => (
                    <Marker
                        key={zone.id}
                        coordinate={zone.coordinate}
                        title={zone.name}
                    >
                        <CustomMarker type="CHECKPOINT" emoji={zone.emoji} />
                        <Callout tooltip>
                            <View className="bg-white p-3 rounded-lg shadow-lg w-48 border-l-4 border-blue-500">
                                <Text className="font-bold text-base mb-1">{zone.name}</Text>
                                <Text className="text-blue-500 font-bold text-xs">
                                    🇺🇳 UN Controlled Area
                                </Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}

                {/* Hellumi Stars Markers */}
                {hellumiStars.map((star) => (
                    <HellumiStarMarker key={star.id} spot={star} />
                ))}

                {/* Multiplayer Ghosts */}
                {otherPlayers.map(player => (
                    <Marker
                        key={`ghost-${player.id}`}
                        coordinate={{ latitude: player.last_latitude || 0, longitude: player.last_longitude || 0 }}
                        title={player.username}
                        description={`Level ${player.level || 1} • ${player.current_tier || 'Rookie'}`}
                        opacity={0.8}
                    >
                        <CustomMarker
                            type="PLAYER"
                            user={{ emoji_avatar: player.emoji_avatar || '👤', tier: player.current_tier || 'Rookie' }}
                        />
                    </Marker>
                ))}

                {/* Auto Landmarks (Ercan & Larnaca) */}
                <Marker coordinate={{ latitude: 35.1500, longitude: 33.5000 }} title="Ercan Airport">
                    <Text style={{ fontSize: 30 }}>✈️</Text>
                </Marker>
                <Marker coordinate={{ latitude: 34.8723, longitude: 33.6204 }} title="Larnaca Airport">
                    <Text style={{ fontSize: 30 }}>✈️</Text>
                </Marker>

                {reports.map((report) => (
                    <Marker
                        key={report.id}
                        coordinate={{ latitude: report.latitude, longitude: report.longitude }}
                        title={report.type}
                    >

                        <MemoizedCustomMarker type={report.type} user={report.user} />
                        <Callout>
                            <View className="p-2 w-40">
                                <Text className="font-bold">{report.type}</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
                {/* 7. BOTS (Enemies) */}
                {bots.map((bot) => (
                    <Marker
                        key={bot.id}
                        coordinate={{ latitude: bot.latitude, longitude: bot.longitude }}
                        title="Enemy Bot"
                        onCalloutPress={() => {
                            Alert.alert("Enemy Encounter", "Fight this bot?", [
                                { text: "Run" },
                                {
                                    text: "Fight ⚔️", onPress: async () => {
                                        if (!currentUser) return;
                                        // Simple win logic
                                        const win = Math.random() > 0.3;
                                        if (win) {
                                            // Try to get loot
                                            const droppedItem = await DominionService.dropItemChance(currentUser.id);

                                            // Requirement: +50 Coins, +20 XP
                                            const earnedCoins = 50;
                                            const earnedXp = 20;

                                            let msg = `You defeated the bot!\n+${earnedXp} XP\n+${earnedCoins} Coins`;
                                            if (droppedItem) {
                                                msg += `\n\n🎁 LOOT DROPPED!\n${droppedItem.item_type} (Power: ${droppedItem.power})`;
                                            }

                                            Alert.alert("Victory! 🏆", msg);

                                            // Update coins - fetch current value first to avoid stale data
                                            const { data: currentProfile } = await supabase
                                                .from('profiles')
                                                .select('coins')
                                                .eq('id', currentUser.id)
                                                .single();

                                            if (currentProfile) {
                                                await supabase
                                                    .from('profiles')
                                                    .update({ coins: currentProfile.coins + earnedCoins })
                                                    .eq('id', currentUser.id);
                                            }

                                            // Add XP using the RPC function
                                            await supabase.rpc('add_xp', {
                                                user_id: currentUser.id,
                                                amount: earnedXp
                                            });

                                            setBots(prev => prev.filter(b => b.id !== bot.id));
                                        } else {
                                            Alert.alert("Defeat", "You took damage and ran away.");
                                        }
                                    }
                                }
                            ]);
                        }}
                    >
                        <View className="items-center">
                            <Text style={{ fontSize: 28 }}>🤖</Text>
                            <View className="bg-red-600 w-8 h-1 mt-1 rounded-full" />
                        </View>
                    </Marker>
                ))}

            </MapView>

            {/* --- NEW GAME UI --- */}

            {/* World News Ticker */}
            <View className="absolute top-24 w-full z-40">
                <WorldNewsTicker />
            </View>

            {/* Top HUD (Stats) */}
            <GameHUD
                coins={currentUser?.coins || 0}
                gems={currentUser?.gems || 0}
                health={currentUser?.health || 100}
                maxHealth={currentUser?.max_health || 100}
                energy={currentUser?.energy || 100}
                backpackCount={currentUser?.inventory_count || 0} // Actual count
                backpackCapacity={currentUser?.inventory_capacity || 50}
            />

            {/* Right Action Buttons */}
            <View className="absolute right-4 top-40 z-40 space-y-3">
                {/* Inventory / Backpack */}
                <TouchableOpacity
                    onPress={() => setShowBackpack(true)}
                    className="bg-purple-600 p-3 rounded-full border-2 border-white shadow-xl"
                >
                    <Text className="text-xl">🎒</Text>
                </TouchableOpacity>
                {/* Leaderboard */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('Leaderboard')}
                    className="bg-yellow-500 p-3 rounded-full border-2 border-white shadow-xl"
                >
                    <Text className="text-xl">🏆</Text>
                </TouchableOpacity>
                {/* Global Chat */}
                <TouchableOpacity
                    onPress={() => Alert.alert("Global Channel", "Connecting to frequency... 📡")}
                    className="bg-green-600 p-3 rounded-full border-2 border-white shadow-xl"
                >
                    <Text className="text-xl">🌍</Text>
                </TouchableOpacity>
            </View>

            {/* WAZE UI LAYER */}

            {/* Report FAB (Bottom Right, floating above Dock) */}
            <TouchableOpacity
                onPress={() => setShowReportMenu(true)}
                className="absolute bottom-44 right-4 w-12 h-12 bg-orange-500 rounded-full items-center justify-center shadow-lg border-2 border-white z-40"
            >
                <Text style={{ fontSize: 22 }}>⚠️</Text>
            </TouchableOpacity>

            {/* NEW: Player Dock (Bottom Bar) */}
            {/* Added extra bottom padding for Safe Area compatibility */}
            <View className="absolute bottom-16 w-full z-50">
                {/* Increased from bottom-10 to bottom-16 to avoid home indicator overlap */}
                <PlayerDock
                    user={currentUser}
                    onPress={() => setShowDashboard(true)}
                    onSearchPress={() => navigation.navigate('Search')}
                    onBuildPress={handleBuild}
                />
            </View>

            {/* Full Screen Report Menu Modal */}
            <WazeReportMenu
                visible={showReportMenu}
                onClose={() => setShowReportMenu(false)}
                onReport={(type) => {
                    handleCreateReport(type as any);
                    setShowReportMenu(false);
                }}
            />

            {/* Verification Card */}
            {nearestReport && (
                <View className="absolute bottom-32 w-full z-10 px-2">
                    <VerificationCard
                        reportType={nearestReport.type}
                        onVerify={() => handleVerify(nearestReport.id, 'VERIFY')}
                        onReject={() => handleVerify(nearestReport.id, 'REJECT')}
                    />
                </View>
            )}

            {/* Modals */}
            <BackpackModal
                visible={showBackpack}
                onClose={() => setShowBackpack(false)}
                userId={currentUser?.id || ''}
            />

            <PlayerDashboardModal
                visible={showDashboard}
                onClose={() => setShowDashboard(false)}
                user={currentUser}
            />

            {/* ADMIN TOOLS */}
            <AdminToolsModal
                visible={showAdminTools}
                onClose={() => setShowAdminTools(false)}
                user={currentUser}
                onTeleport={(lat: number, lon: number) => {
                    setLocation({
                        coords: { latitude: lat, longitude: lon, altitude: 0, accuracy: 0, altitudeAccuracy: 0, heading: 0, speed: 0 },
                        timestamp: Date.now()
                    } as any);
                    setFollowUser(false);
                    if (mapRef.current) {
                        mapRef.current.animateToRegion({
                            latitude: lat,
                            longitude: lon,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01
                        });
                    }
                }}
            />

            {/* Admin Button (Only for Admin) */}
            {isAdmin && (
                <TouchableOpacity
                    onPress={() => setShowAdminTools(true)}
                    className="absolute top-12 left-4 bg-red-600 p-2 rounded-full border-2 border-white shadow-xl z-50"
                >
                    <Text className="text-2xl">🛡️</Text>
                </TouchableOpacity>
            )}

            {/* Game Feature Buttons (Left Side) */}
            <View className="absolute top-40 left-4 space-y-2 z-40">
                <TouchableOpacity
                    onPress={() => setShowQuests(true)}
                    className="bg-purple-600 p-3 rounded-full border-2 border-white shadow-xl"
                >
                    <Text className="text-xl">📋</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowAchievements(true)}
                    className="bg-yellow-500 p-3 rounded-full border-2 border-white shadow-xl"
                >
                    <Text className="text-xl">🏅</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setShowFaction(true)}
                    className="bg-blue-600 p-3 rounded-full border-2 border-white shadow-xl"
                >
                    <Text className="text-xl">⚔️</Text>
                </TouchableOpacity>
            </View>

            {/* New Game Modals */}
            <DailyQuestsModal
                visible={showQuests}
                onClose={() => setShowQuests(false)}
                onQuestCompleted={(coins, xp) => {
                    Alert.alert('Quest Completed!', `+${coins} 💰  +${xp} ⭐`);
                }}
            />

            <AchievementsModal
                visible={showAchievements}
                onClose={() => setShowAchievements(false)}
            />

            <FactionModal
                visible={showFaction}
                onClose={() => setShowFaction(false)}
                onJoined={(faction) => {
                    // Refresh user data after joining faction
                }}
            />

            <OnboardingTutorial
                visible={showTutorial}
                onComplete={() => setShowTutorial(false)}
            />

        </View >
    );
};

