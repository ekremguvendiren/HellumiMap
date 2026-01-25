import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { GlassContainer } from '../common/GlassContainer';

interface WazeReportMenuProps {
    visible: boolean;
    onClose: () => void;
    onReport: (type: string) => void;
}

const REPORT_TYPES = [
    { id: 'TRAFFIC', label: 'Traffic', icon: '🚗', color: 'bg-yellow-500' },
    { id: 'POLICE', label: 'Police', icon: '👮', color: 'bg-blue-500' },
    { id: 'ACCIDENT', label: 'Crash', icon: '💥', color: 'bg-red-500' },
    { id: 'HAZARD', label: 'Hazard', icon: '⚠️', color: 'bg-orange-500' },
    { id: 'HELLUMI_SPOT', label: 'Hellumi', icon: '🧀', color: 'bg-yellow-400' }, // Fun custom one
    { id: 'MAP_ISSUE', label: 'Map Issue', icon: '🗺️', color: 'bg-gray-500' },
    { id: 'GAS', label: 'Gas Prices', icon: '⛽', color: 'bg-green-500' },
    { id: 'PLACE', label: 'Place', icon: '📍', color: 'bg-purple-500' },
    { id: 'HELP', label: 'Roadside', icon: '🆘', color: 'bg-red-700' },
];

export const WazeReportMenu: React.FC<WazeReportMenuProps> = ({
    visible,
    onClose,
    onReport
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="flex-1 bg-black/60 justify-end"
            >
                <View className="bg-gray-900 rounded-t-3xl p-6 pb-12 border-t border-white/10">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-white text-2xl font-bold">What do you see?</Text>
                        <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center">
                            <Text className="text-gray-400 font-bold">X</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row flex-wrap justify-between">
                        {REPORT_TYPES.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => {
                                    onReport(item.id);
                                    onClose();
                                }}
                                className="w-[30%] items-center mb-6"
                            >
                                <View className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${item.color} shadow-lg border-2 border-white/20`}>
                                    <Text style={{ fontSize: 32 }}>{item.icon}</Text>
                                </View>
                                <Text className="text-white font-bold text-sm text-center">{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};
