'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './navbar.module.css'


export default function Navbar() {
    const pathname = usePathname();



    return (
        <nav className={styles.navbar}>
            <ul className="flex space-x-4">
                <li
                    className={`${pathname === '/' ? styles.active : ''}`}
                >
                    <Link
                        href="/"
                        className={pathname === '/' ? 'text-white' : 'text-gray-400'}
                    >
                        Accueil
                    </Link>
                </li>
                <li>
                    <Link href="/event" className={pathname === '/search' ? 'text-white' : 'text-gray-400'}>
                        Recherche
                    </Link>
                </li>
                <li>
                    <Link href="/myevent" className={pathname === '/event' ? 'text-white' : 'text-gray-400'}>
                        Évènements
                    </Link>
                </li>
                <li>
                    <Link href="/create" className={pathname === '/create' ? 'text-white' : 'text-gray-400'}>
                        Créer
                    </Link>
                </li>
            </ul>
        </nav>
    );
}