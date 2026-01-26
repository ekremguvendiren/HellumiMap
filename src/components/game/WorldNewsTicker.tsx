// World News Ticker Component
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, FlatList, Modal } from 'react-native';
import { WorldNews, newsService, NEWS_EVENT_CONFIGS } from '../../services/newsService';

interface WorldNewsTickerProps {
    onExpand?: () => void;
}

export const WorldNewsTicker: React.FC<WorldNewsTickerProps> = ({ onExpand }) => {
    const [news, setNews] = useState<WorldNews[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showFullNews, setShowFullNews] = useState(false);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        loadNews();

        // Subscribe to real-time updates
        const unsubscribe = newsService.subscribeToNews((newItem) => {
            setNews(prev => [newItem, ...prev.slice(0, 49)]);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (news.length === 0) return;

        // Rotate news every 5 seconds
        const interval = setInterval(() => {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            setTimeout(() => {
                setCurrentIndex(prev => (prev + 1) % news.length);
            }, 300);
        }, 5000);

        return () => clearInterval(interval);
    }, [news.length, fadeAnim]);

    const loadNews = async () => {
        const latestNews = await newsService.getLatestNews(20);
        setNews(latestNews);
    };

    const currentNews = news[currentIndex];

    if (!currentNews) {
        return null;
    }

    const { emoji, color, timeAgo } = newsService.formatNewsItem(currentNews);

    const renderNewsItem = ({ item }: { item: WorldNews }) => {
        const formatted = newsService.formatNewsItem(item);
        return (
            <View style={[styles.newsListItem, { borderLeftColor: formatted.color }]}>
                <View style={styles.newsListHeader}>
                    <Text style={styles.newsListEmoji}>{formatted.emoji}</Text>
                    <Text style={styles.newsListTime}>{formatted.timeAgo}</Text>
                </View>
                <Text style={styles.newsListTitle}>{item.title}</Text>
                <Text style={styles.newsListDescription}>{item.description}</Text>
            </View>
        );
    };

    return (
        <>
            <TouchableOpacity onPress={() => setShowFullNews(true)} activeOpacity={0.8}>
                <View style={styles.tickerContainer}>
                    <View style={[styles.tickerDot, { backgroundColor: color }]} />
                    <Animated.View style={[styles.tickerContent, { opacity: fadeAnim }]}>
                        <Text style={styles.tickerEmoji}>{emoji}</Text>
                        <View style={styles.tickerTextContainer}>
                            <Text style={styles.tickerTitle} numberOfLines={1}>
                                {currentNews.title}
                            </Text>
                            <Text style={styles.tickerTime}>{timeAgo}</Text>
                        </View>
                    </Animated.View>
                    <View style={styles.expandButton}>
                        <Text style={styles.expandIcon}>📜</Text>
                    </View>
                </View>
            </TouchableOpacity>

            <Modal
                visible={showFullNews}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFullNews(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>🌍 World News</Text>
                            <TouchableOpacity onPress={() => setShowFullNews(false)}>
                                <Text style={styles.closeButton}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={news}
                            renderItem={renderNewsItem}
                            keyExtractor={item => item.id}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.newsList}
                        />
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    tickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(26, 26, 46, 0.95)',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    tickerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    tickerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tickerEmoji: {
        fontSize: 20,
        marginRight: 8,
    },
    tickerTextContainer: {
        flex: 1,
    },
    tickerTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    tickerTime: {
        color: '#888',
        fontSize: 11,
        marginTop: 2,
    },
    expandButton: {
        padding: 4,
    },
    expandIcon: {
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#1a1a2e',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalTitle: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        color: '#888',
        fontSize: 24,
        padding: 4,
    },
    newsList: {
        padding: 16,
    },
    newsListItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    newsListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    newsListEmoji: {
        fontSize: 24,
    },
    newsListTime: {
        color: '#888',
        fontSize: 12,
    },
    newsListTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    newsListDescription: {
        color: '#aaa',
        fontSize: 14,
        lineHeight: 20,
    },
});

export default WorldNewsTicker;
