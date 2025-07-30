'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api'; // Importing the API instance
import styles from './newmessage.module.css'; // Assuming you have a CSS module for styles
import { User } from '@/types/user';

export default function NewMessagePage() {
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [recipient, setRecipient] = useState('');
    const [recipients, setRecipients] = useState<string[]>([]);

    const router = useRouter();
    const params = useParams();

    if (params?.senderId) {
        setRecipient(params.senderId as string);
    }

    const fetchPossibleRecipients = async () => {
        try {
            const response = await api.get('/messageList'); // Assuming you have an endpoint to fetch users
            if (response.data && Array.isArray(response.data.contacts)) {
                setRecipients(response.data.contacts.map((user: User) => user._id));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/messages', {
                subject,
                content,
                recipient,
            });

            if (response.data && response.data.message) {
                // Redirect to the message page after successful creation
                router.push(`/message`);
            }
        } catch (error) {
            console.error('Error creating message:', error);
        }
    };

    useEffect(() => {
        fetchPossibleRecipients();
    }, []);

    return (
        <div>
            <h1>Nouveau Message</h1>
            <div className={styles.formContainer} onSubmit={handleSubmit}>
                <div>
                <label htmlFor="recipient">Destinataire:</label>
                <select
                    id="recipient"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                >
                    <option value="">Sélectionner un destinataire</option>
                    {recipients.map((id) => (
                        <option key={id} value={id}>
                            {id}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="subject">Sujet:</label>
                <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
                <label htmlFor="content">Contenu:</label>
                <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
                <button>Envoyer</button>
            </div>
            </div>
        </div>
    )
}
