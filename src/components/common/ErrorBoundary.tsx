// Error Boundary Component for graceful error handling
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        // Here you could send to an error reporting service like Sentry
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View style={styles.container}>
                    <Text style={styles.emoji}>😵</Text>
                    <Text style={styles.title}>Oops! Something went wrong</Text>
                    <Text style={styles.message}>
                        Don't worry, your progress is saved. Try again or restart the app.
                    </Text>
                    {__DEV__ && (
                        <Text style={styles.errorText}>
                            {this.state.error?.message}
                        </Text>
                    )}
                    <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                        <Text style={styles.retryText}>🔄 Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emoji: {
        fontSize: 72,
        marginBottom: 24,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    errorText: {
        color: '#F44336',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 24,
        padding: 12,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderRadius: 8,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
    },
    retryText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ErrorBoundary;
