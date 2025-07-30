'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './register.module.css';
import Link from 'next/link';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [sport, setSport] = useState('');
    const [level, setLevel] = useState('');
    const [disponibility, setDisponibility] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('Les mots de passe ne correspondent pas.');
            return;
        }

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, surname, email, password }),
        });

        const data = await res.json();
        if (res.ok) {
            alert('Inscription réussie !');
            setTimeout(() => {
                router.push('/login');
            }, 200);
        } else {
            alert('Erreur d\'inscription : ' + data.message);
        }
    };

    return (
        <div className={styles.container}>
            <form onSubmit={handleRegister} className={styles.form}>
                <label htmlFor="name">Prénom</label>
                <input type="text" id="name" placeholder="Prénom ..." value={name} onChange={(e) => setName(e.target.value)} required />
                <label htmlFor="surname">Nom</label>
                <input type="text" id="surname" placeholder="Nom ..." value={surname} onChange={(e) => setSurname(e.target.value)} required />
                <label htmlFor="sport">Sport</label>
                <input type="text" id="sport" placeholder="Sport ..." value={sport} onChange={(e) => setSport(e.target.value)} required />
                <label htmlFor="level">Niveau</label>
                <input type="text" id="level" placeholder="Niveau ..." value={level} onChange={(e) => setLevel(e.target.value)} required />
                <label htmlFor="disponibility">Disponibilité</label>
                <input type="text" id="disponibility" placeholder="Disponibilité ..." value={disponibility} onChange={(e) => setDisponibility(e.target.value)} required />
                <label htmlFor="email">Email</label>
                <input type="text" id="email" placeholder="Email ..." value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label htmlFor="password">Mot de passe</label>
                <input type="password" id="password" placeholder="Mot de passe ..." value={password} onChange={(e) => setPassword(e.target.value)} required />
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input type="password" id="confirmPassword" placeholder="Confirmer le mot de passe ..." value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                <button type="submit">S'inscrire</button>
            </form>
            <div className={styles.loginLink}>
                <p>Déjà inscrit ? <Link href="/login">Se connecter</Link></p>
            </div>
        </div>
    );
}