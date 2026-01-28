import React from 'react';
import { View } from 'react-native';

interface ActionSidebarProps {
    onGiftsPress?: () => void;
    onLeaderboardPress?: () => void;
    onChatPress?: () => void;
    unreadGifts?: number;
}

// Sidebar removed - all actions now in left sidebar
export const ActionSidebar: React.FC<ActionSidebarProps> = () => {
    return null; // Empty - functionality moved to left sidebar
};
