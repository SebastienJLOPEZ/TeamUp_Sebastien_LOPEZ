'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api'; // Importing the API instance
import styles from './messageUnique.module.css'; // Assuming you have a CSS module for styles
import Link from 'next/link';
import { Message } from '@/types/message';
import { useMessageCache } from '@/hooks/messageCache';

export default function MessageUniquePage() {
    const [message, setMessage] = useState<Message | null>(null);
    const { getStoredMessages, setStoredMessage } = useMessageCache('recieved');
    const router = useRouter();
    const params = useParams();

    // Get messageId from the URL params
    const messageId = params?.id as string;

    const fetchMessage = async (messageId: string) => {
        try {

            const cachedMessage = getStoredMessages().find((msg) => msg._id === messageId);
            if (cachedMessage) {
                setMessage(cachedMessage);
                return;
            }

            const response = await api.get(`/messages/${messageId}`);
            if (response.data && response.data.message) {
                setStoredMessage(response.data.message);
                setMessage(response.data.message);
            }

        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    useEffect(() => {
        if (messageId) {
            fetchMessage(messageId);
        }
    }, [messageId]);

    return (
        <div>
            <div className={styles.messageContainer}>
                {message ? (
                    <>
                    <div>
                        <div>
                            <h2>{message.subject}</h2>
                            <p><strong>De:</strong> {message.sender?.name} {message.sender?.surname}</p>
                            <p><strong>Date:</strong> {new Date(message.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            {message.sender?.name === 'Équipe TeamUp' && (
                                <Link 
                                href={{
                                    pathname: "/message/new",
                                    query: { senderId: message.sender?._id, subject: message.subject }
                                }} 
                                as="/message/new"
                                passHref
                            >
                                Répondre
                            </Link>
                            )}
                        </div>
                    </div>
                    <div>
                        <p>{message.content}</p>
                    </div>
                    </>
                ) : (
                    <p>Chargement...</p>
                )}
            </div>
            <Link href="/message">Back to Messages</Link>
        </div>
    )
}
