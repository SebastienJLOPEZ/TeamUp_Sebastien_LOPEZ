export const fetchTokens = () => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        return { token, refreshToken };
    }
};

export const setTokens = (token: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
    }
};

export const removeTokens = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('tokenRefresh');
    }
};

export const refreshAccessToken = async () => {
    try {
        const refreshToken = fetchTokens()?.refreshToken;
        if (!refreshToken) throw new Error('No refresh token available');

        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/refresh-token`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${refreshToken}`,
            },
        });

        console.log('Response from refresh endpoint:', response);

        if (!response.ok) throw new Error('Failed to refresh token');

        const data = await response.json();
        setTokens(data.token, data.refreshToken);
        return data.token;
    } catch (error) {
        removeTokens();
        throw error;
    }
};