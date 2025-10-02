import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function SignUpScreen() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({
        email: '',
        username: '',
        password: ''
    });
    const primaryColor = useThemeColor({}, 'primary');
    const surfaceColor = useThemeColor({}, 'surface');
    const inputBackground = useThemeColor({}, 'inputBackground');
    const inputBorder = useThemeColor({}, 'inputBorder');
    const textColor = useThemeColor({}, 'text');
    const mutedColor = useThemeColor({}, 'textMuted');
    const dangerColor = useThemeColor({}, 'danger');
    const shadowColor = useThemeColor({}, 'shadow');

    const clearError = (field: string) => {
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateInput = () => {
        const newErrors = { email: '', username: '', password: '' };
        let isValid = true;

        // Email validation: must contain @ and then .
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            newErrors.email = 'Email must be in the format: example@domain.com';
            isValid = false;
        }

        // Username validation: 3-16 characters
        if (username.length < 3 || username.length > 16) {
            newErrors.username = 'Username must be between 3 and 16 characters long';
            isValid = false;
        }

        // Password validation: must be at least 8 characters and contain at least one number
        if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters long';
            isValid = false;
        } else if (!/\d/.test(password)) {
            newErrors.password = 'Password must contain at least one numerical character';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSignUp = async () => {
        if (!validateInput()) {
            return;
        }

        try {
            const response = await fetch('http://172.16.177.169:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert('Success', 'You have successfully signed up!');
            } else {
                Alert.alert('Error', data.message || 'Something went wrong');
            }
        } catch (error) {
            Alert.alert('Error', 'Something went wrong');
            console.error('Sign up failed', error);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <ThemedView
                variant="surface"
                style={[styles.card, { backgroundColor: surfaceColor, shadowColor }]}
            >
                <ThemedText type="title" style={styles.title}>
                    Sign Up
                </ThemedText>
                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: inputBackground,
                            borderColor: errors.email ? dangerColor : inputBorder,
                            color: textColor,
                        },
                    ]}
                    placeholder="Email"
                    placeholderTextColor={mutedColor}
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        clearError('email');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {errors.email ? (
                    <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                        {errors.email}
                    </ThemedText>
                ) : null}

                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: inputBackground,
                            borderColor: errors.username ? dangerColor : inputBorder,
                            color: textColor,
                        },
                    ]}
                    placeholder="Username"
                    placeholderTextColor={mutedColor}
                    value={username}
                    onChangeText={(text) => {
                        setUsername(text);
                        clearError('username');
                    }}
                    autoCapitalize="none"
                />
                {errors.username ? (
                    <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                        {errors.username}
                    </ThemedText>
                ) : null}

                <TextInput
                    style={[
                        styles.input,
                        {
                            backgroundColor: inputBackground,
                            borderColor: errors.password ? dangerColor : inputBorder,
                            color: textColor,
                        },
                    ]}
                    placeholder="Password"
                    placeholderTextColor={mutedColor}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        clearError('password');
                    }}
                    secureTextEntry
                />
                {errors.password ? (
                    <ThemedText style={[styles.errorText, { color: dangerColor }]}>
                        {errors.password}
                    </ThemedText>
                ) : null}
                <TouchableOpacity
                    style={[styles.signUpButton, { backgroundColor: primaryColor, shadowColor }]}
                    onPress={handleSignUp}>
                    <ThemedText
                        style={styles.buttonText}
                        lightColor="#FFFFFF"
                        darkColor="#0F0B20">
                        Sign Up
                    </ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    card: {
        borderRadius: 24,
        padding: 24,
        gap: 16,
        elevation: 6,
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.18,
        shadowRadius: 24,
    },
    title: {
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    errorText: {
        fontSize: 12,
        fontWeight: '500',
    },
    signUpButton: {
        paddingVertical: 16,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
