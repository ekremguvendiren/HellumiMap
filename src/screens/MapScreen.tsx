import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Image } from 'react-native';
import { EVService, EVStation } from '../services/evService';
import { GeoUtils, GREEN_LINE_POLYGON } from '../utils/geoUtils';
import MapView from 'react-native-map-clustering';
import { Marker, Callout, PROVIDER_GOOGLE, Circle, Polyline, Polygon } from 'react-native-maps'; // Correct Imports

// ... (In MapScreen component)

// 6. EV Stations & Green Line
const [evStations, setEvStations] = useState<EVStation[]>([]);
const [inBufferZone, setInBufferZone] = useState(false);

// Load World Data
useEffect(() => {
    const loadWorld = async () => {
        const b = await DominionService.getBuildings();
        setBuildings(b);
        const m = await DominionService.getMonuments();
        setMonuments(m);
        const ev = await EVService.fetchStations();
        setEvStations(ev);
    };
    loadWorld();
}, []);

// Monitor Buffer Zone
useEffect(() => {
    if (!location) return;
    const inside = GeoUtils.isPointInPolygon(location.coords, GREEN_LINE_POLYGON);
    if (inside && !inBufferZone) {
        Alert.alert("Warning", "Entering UN Buffer Zone! Watch out for Guardians.");
        // Change Circle Color visual logic via state
    }
    setInBufferZone(inside);
}, [location]);

// ...

{/* 1. Dominion Interaction Circle (200m) */ }
{
    location && (
        <Circle
            center={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
            radius={200}
            fillColor={inBufferZone ? "rgba(255, 0, 0, 0.2)" : "rgba(52, 152, 219, 0.2)"}
            strokeColor={inBufferZone ? "rgba(255, 0, 0, 0.5)" : "rgba(52, 152, 219, 0.5)"}
            strokeWidth={1}
            zIndex={900}
        />
    )
}

{/* GREEN LINE POLYGON */ }
<Polygon
    coordinates={GREEN_LINE_POLYGON}
    fillColor="rgba(0, 255, 0, 0.2)"
    strokeColor="lime"
    strokeWidth={2}
/>

{/* EV STATIONS */ }
{
    evStations.map((ev) => (
        <Marker
            key={`ev-${ev.ID}`}
            coordinate={{ latitude: ev.AddressInfo.Latitude, longitude: ev.AddressInfo.Longitude }}
            title={ev.AddressInfo.Title}
            description={`Power: ${ev.Connections?.[0]?.PowerKW || '?'} kW`}
        >
            <View className="items-center justify-center bg-green-100 p-1 rounded-full border border-green-600">
                <Text style={{ fontSize: 20 }}>🔋</Text>
            </View>
            <Callout>
                <View className="p-2 w-48">
                    <Text className="font-bold mb-1">{ev.AddressInfo.Title}</Text>
                    <Text className="text-xs text-gray-600 mb-1">{ev.OperatorInfo?.Title || 'Unknown Operator'}</Text>
                    <Text className="text-xs text-gray-500">
                        {ev.Connections?.[0]?.PowerKW} kW - {ev.Connections?.[0]?.ConnectionType?.Title}
                    </Text>
                    <Text className="text-[10px] text-gray-400 mt-2 italic">Data provided by Open Charge Map</Text>
                </View>
            </Callout>
        </Marker>
    ))
}

{/* 2. User Buildings */ }
{
    buildings.map((b) => (
        <Marker
            key={b.id}
            coordinate={{ latitude: b.latitude, longitude: b.longitude }}
            title={`Building Lv.${b.level}`}
            onCalloutPress={() => {
                // ... existing logic ...
                if (b.user_id === currentUser?.id) {
                    DominionService.collectIncome(currentUser.id, b, location!.coords.latitude, location!.coords.longitude);
                } else if (currentUser) {
                    DominionService.attackBuilding(currentUser.id, b, location!.coords.latitude, location!.coords.longitude);
                }
            }}
        >
            <View className="items-center">
                <Text style={{ fontSize: 32 }}>{DominionService.getBuildingEmoji(b.level)}</Text>
                {b.ruined_until && <Text className="absolute text-2xl -top-2">🔥</Text>}
                <View className="bg-black/50 px-2 rounded-full mt-1">
                    <Text className="text-white text-[10px] font-bold">Lv.{b.level}</Text>
                </View>
            </View>
        </Marker>
    ))
}

{/* 3. Monuments (World Bosses) */ }
{
    monuments.map((m) => (
        <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
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
    ))
}

{/* ... Districts ... */ }

{
    reports.map((report) => (
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
    ))
}
import * as Location from 'expo-location';
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

    // Fixed Radar (Apple Camera Emoji in white bubble)
    if (isFixed) {
        return (
            <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg border-2 border-gray-200">
                <Text style={{ fontSize: 22 }}>📷</Text>
                {speed_limit && (
                    <View className="absolute -top-2 -right-2 bg-red-600 rounded-full w-5 h-5 items-center justify-center border border-white">
                        <Text className="text-white text-[8px] font-bold">{speed_limit}</Text>
                    </View>
                )}
            </View>
        );
    }

    // User Avatar
    if (user?.emoji_avatar) {
        return (
            <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg border-2 border-cyan-500">
                <Text style={{ fontSize: 24 }}>{user.emoji_avatar}</Text>
                {/* Small type badge */}
                <View className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-800 items-center justify-center border border-white">
                    <Text style={{ fontSize: 8 }}>
                        {type === 'SPEED_CAMERA' ? '📷' : type === 'POLICE' ? '👮' : '🚗'}
                    </Text>
                </View>
            </View>
        );
    }

    // Default Pins
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
            bgColor = "#991B1B"; // Red-800 (Darker for severe)
            symbol = "💥";
            break;
    }

    return (
        <View style={{ backgroundColor: bgColor }} className="w-8 h-8 rounded-full border-2 border-white items-center justify-center shadow-md">
            <Text style={{ fontSize: 16 }}>{symbol}</Text>
        </View>
    );

}

// Optimized Marker Component
const MemoizedCustomMarker = React.memo(CustomMarker);

export const MapScreen = () => {
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

    // 5. Dominion (GPS-RPG)
    const [buildings, setBuildings] = useState<UserBuilding[]>([]);
    const [monuments, setMonuments] = useState<Monument[]>([]);
    const [gasStations, setGasStations] = useState<GasStation[]>([]);
    const [showBackpack, setShowBackpack] = useState(false);

    // 6. EV Stations & Green Line
    const [evStations, setEvStations] = useState<EVStation[]>([]);
    const [inBufferZone, setInBufferZone] = useState(false);

    // 7. Fog & Treasures
    const [revealedAreas, setRevealedAreas] = useState<{ latitude: number, longitude: number }[]>([]);
    const [treasures, setTreasures] = useState<any[]>([]);

    // Load World Data
    useEffect(() => {
        const loadWorld = async () => {
            const b = await DominionService.getBuildings();
            setBuildings(b);
            const m = await DominionService.getMonuments();
            setMonuments(m);
            const ev = await EVService.fetchStations();
            setEvStations(ev);
            const gas = await DominionService.getGasStations();
            setGasStations(gas);
            const t = await DominionService.getTreasures();
            setTreasures(t);
        };
        loadWorld();
    }, []);

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
        // Check if user is already near a building (overlap prevention) - Simplified for MVP: Just build
        // Actual overlap logic should be in service or backend
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
            }
        })();

        // Realtime Subscription
        const reportSub = supabase
            .channel('reports-channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reports' },
                async (payload) => {
                    const newReport = payload.new as any;
                    // Parse location
                    let lat = newReport.latitude || 0;
                    let long = newReport.longitude || 0;

                    // Fetch profile logic omitted for brevity in realtime, ideally we join or fetch
                    let userProfile = undefined;
                    if (newReport.user_id) {
                        const { data } = await supabase.from('profiles').select('username, current_tier, emoji_avatar').eq('id', newReport.user_id).single();
                        if (data) userProfile = data;
                    }

                    const marker: ReportMarker = {
                        id: newReport.id,
                        latitude: lat,
                        longitude: long,
                        type: newReport.type,
                        user: userProfile
                    };

                    setReports(prev => [marker, ...prev]);

                    // Voice Announcement if Close
                    if (location) {
                        const dist = getDistanceMeters(location.coords.latitude, location.coords.longitude, lat, long);
                        if (dist < 1000) {
                            VoiceService.speak(t('map.traffic_ahead')); // Generic for now
                        }
                    }
                })
            .subscribe();

        // Return cleanup
        return () => {
            if (locationSub) locationSub.remove();
            supabase.removeChannel(reportSub);
        };
    }, []);

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
    const handleCreateReport = async (type: 'POLICE' | 'SPEED_CAMERA' | 'HAZARD' | 'HELLUMI_SPOT' | 'ACCIDENT') => {
        if (!location || !currentUser) return;
        try {
            await ReportService.createReport(currentUser.id, type, location.coords.latitude, location.coords.longitude);
            VoiceService.speak("Reported! +10 XP"); // Local feedback
            Alert.alert("Reported!", "You gained +10 XP!");
            // Refresh logic optional or rely on subscription
        } catch (e) {
            Alert.alert(t('common.error'));
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
                                    <Text style={{ fontSize: 24 }}>{currentUser?.emoji_avatar || '🏎️'}</Text>
                                </View>
                            </View>
                        </View>
                    </Marker>
                )}

                {/* 1. Dominion Interaction Circle (200m) */}
                {location && (
                    <Circle
                        center={{ latitude: location.coords.latitude, longitude: location.coords.longitude }}
                        radius={200}
                        fillColor="rgba(52, 152, 219, 0.2)"
                        strokeColor="rgba(52, 152, 219, 0.5)"
                        strokeWidth={1}
                        zIndex={900}
                    />
                )}

                {/* 2. User Buildings */}
                {buildings.map((b) => (
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
                            <Text style={{ fontSize: 32 }}>{DominionService.getBuildingEmoji(b.level)}</Text>
                            {b.ruined_until && <Text className="absolute text-2xl -top-2">🔥</Text>}
                            <View className="bg-black/50 px-2 rounded-full mt-1">
                                <Text className="text-white text-[10px] font-bold">Lv.{b.level}</Text>
                            </View>
                        </View>
                    </Marker>

                ))}

                {/* 3. Monuments (World Bosses) */}
                {monuments.map((m) => (
                    <Marker
                        key={m.id}
                        coordinate={{ latitude: m.latitude, longitude: m.longitude }}
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
                        coordinate={{ latitude: g.latitude, longitude: g.longitude }}
                        title={g.name}
                        onCalloutPress={() => {
                            if (!location || !currentUser) return;
                            Alert.alert("Gas Station", `Buy Fuel at ${g.brand}? (100 Coins)`, [
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
            </MapView>

            {/* Top Bar with Search & XP */}
            <SafeAreaView className="absolute top-0 w-full z-50 pointer-events-box-none">
                {/* XP Progress Overlay */}
                {currentUser && (
                    <XPProgressBar
                        currentXP={currentUser.current_xp || 0}
                        nextTierXP={100} // Mock next tier threshold or calc logic
                        tierName={currentUser.current_tier || 'Traveler'}
                    />
                )}

                {/* Search Bar */}
                <SearchBar
                    onPlaceSelected={async (details) => {
                        if (details && mapRef.current) {
                            const { lat, lng } = details;

                            // Animate Camera
                            mapRef.current.animateToRegion({
                                latitude: lat,
                                longitude: lng,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            });
                            setFollowUser(false);

                            // Calculate Route (if location available)
                            if (location) {
                                const route = await NavigationService.getRoute(
                                    location.coords.latitude,
                                    location.coords.longitude,
                                    lat,
                                    lng
                                );

                                if (route) {
                                    setRouteCoords(route.coordinates);

                                    // Spawn Bots
                                    const newBots = NavigationService.generateBots(route.coordinates);
                                    setBots(newBots);

                                    Alert.alert("Route Calculated", `Distance: ${(route.distance / 1000).toFixed(1)} km. Watch out for Bots! 👾`);
                                }
                            }
                        }
                    }}
                />
            </SafeAreaView>

            {/* Recenter Button */}
            <TouchableOpacity
                onPress={handleRecenter}
                className="absolute bottom-48 right-5 bg-white p-3 rounded-full shadow-lg z-20"
            >
                <Text className="text-xl">📍</Text>
            </TouchableOpacity>

            {/* Test Button (Keep for dev) */}
            <TouchableOpacity
                onPress={handleTestRadar}
                className="absolute bottom-64 right-5 bg-yellow-400 p-3 rounded-xl shadow-lg z-20 items-center justify-center"
                style={{ width: 60, height: 60 }}
            >
                <Text className="text-xl">📡</Text>
            </TouchableOpacity>

            {/* Verification Card */}
            {
                nearestReport && (
                    <View className="absolute bottom-32 w-full z-10 px-2">
                        <VerificationCard
                            reportType={nearestReport.type}
                            onVerify={() => handleVerify(nearestReport.id, 'VERIFY')}
                            onReject={() => handleVerify(nearestReport.id, 'REJECT')}
                        />
                    </View>
                )
            }

            {/* Report FAB */}
            <View className="absolute bottom-10 self-center z-50">
                <ReportFAB onReport={handleCreateReport} />
            </View>

            {/* Dominion Controls */}
            <SafeAreaView className="absolute top-24 right-2 space-y-2">
                <TouchableOpacity
                    onPress={() => setShowBackpack(true)}
                    className="bg-gray-800 p-3 rounded-full border border-gray-600 shadow-lg"
                >
                    <Text className="text-2xl">🎒</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleBuild}
                    className="bg-green-600 p-3 rounded-full border border-white shadow-lg"
                >
                    <Text className="text-2xl">🔨</Text>
                </TouchableOpacity>
            </SafeAreaView>

            {/* Modals */}
            {currentUser && <BackpackModal visible={showBackpack} onClose={() => setShowBackpack(false)} userId={currentUser.id} />}
        </View >
    );
};
