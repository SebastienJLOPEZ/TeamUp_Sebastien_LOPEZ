'use client';
import Link from 'next/link';
import { useState } from 'react';
import styles from './login.module.css';
import { useRouter } from 'next/navigation';
// import Image from 'next/image';

export default function LoginPage() {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const router = useRouter();

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('tokenRefresh', data.refreshToken);
            alert('Connexion réussie !');
            setTimeout(() => {
                    router.push('/');
                }, 200);
        } else {
            alert('Erreur de connexion : ' + data.message);
        }
};

return (
    <div className={styles.container}>
        {/* <div>
            <Image src="/logo.png" alt="Logo" width={100} height={100} />
        </div> */}
    <form onSubmit={handleLogin} className={styles.loginForm}>
        <label htmlFor="email">Email</label>
        <input type="text" id="email" placeholder="Email ..." value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="password">Mot de passe</label>
        <input type="password" id="password" placeholder="Mot de passe ..." value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Se connecter</button>
    </form>
        <div className={styles.registerLink}>
            <p>Pas encore de compte ? <Link href="/register">S'inscrire</Link></p>
        </div>
    </div>
);
}