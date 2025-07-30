import type { Metadata } from "next";
import ProtectedRoute from "../../components/protectedRoute/protectedRoute";
import Navbar from "@/components/navbar/navbar";
import Link from 'next/link';
import Image from 'next/image';
import styles from './protected.module.css';

export const metadata: Metadata = {
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <header className={styles.header}>
        <div>
          <Link href="/profile">
            <Image src="/icon/user.svg" alt="Profile" width={32} height={32} />
          </Link>
        </div>
        <div>
          <Image src="/logo/team_up_logo.webp" alt="Logo" width={82.5} height={75} />
        </div>
        <div>
          <Link href="/message">
            <Image src="/icon/mail.svg" alt="Messages" width={32} height={32} />
          </Link>
        </div>
      </header>
      {children}
      <Navbar />
    </ProtectedRoute>
  );
}
