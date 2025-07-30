'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // Importing the API instance
import styles from './profile.module.css'; // Assuming you have a CSS module for styles
import {removeTokens} from '@/lib/auth'; // Importing the function to remove tokens

export default function ProfilePage() {
    const [user, setUser] = useState<{ email: string; surname: string; name: string } | null>(null);
    const router = useRouter();

    useEffect(() => {// Pas besoin de check, la route est protégée à l'accès de la page
        const fetchUser = async () => {
            try {
                const res = await api.get('/api/user/profile');
                setUser(res.data.data);
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUser();
    }, []);

    const logoff = async () => {
        try {
            removeTokens();
            router.push('/login');
        } catch (error) {
            console.error('Error during logoff:', error);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Mon Profil</h1>
            {user ? (
                <div className={styles.profile}>
                    <p>Prénom: {user?.name}</p>
                    <p>Nom: {user?.surname}</p>
                    <p>Email: {user?.email}</p>
                    <button onClick={logoff} className={styles.logoffButton}>Se déconnecter</button>
                </div>
            ) : (
                <p>Chargement du profil...</p>
            )}
        </div>
    );
}