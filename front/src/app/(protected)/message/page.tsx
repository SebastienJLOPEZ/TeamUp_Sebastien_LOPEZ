'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // Importing the API instance
import styles from './message.module.css'; // Assuming you have a CSS module for styles
import Link from 'next/link';
import { Message } from '@/types/message';
import { useMessageCache } from '@/hooks/messageCache';


export default function MessagePage() {
    const [listType, setListType] = useState('recieved');
    const [messages, setMessages] = useState<Message[]>([]);
    const { getStoredMessages, setStoredMessages } = useMessageCache(listType);
    const router = useRouter();

    const fetchMessage = async (type: string) => {
            try {

                const cachedMessages = getStoredMessages();
                if (cachedMessages.length > 0) {
                    setMessages(cachedMessages);
                }

                const list = type === 'recieved' ? '/api/message/listreceived' : '/api/message/listsend';
                const res = await api.get(list);
                if (res.data && Array.isArray(res.data.messages)) {
                    setStoredMessages(res.data.messages);
                    setMessages(res.data.messages);
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
    }

    useEffect(() => {
        fetchMessage(listType);
    }, [listType]);

return (
    <div>
        <div>
            <Link href="/message/new">
                Nouveau Message
            </Link>
        </div>
        <div>
            <div>
                <input
                    type="radio"
                    name="messageType"
                    id="receivedMessages"
                    value="recieved"
                    checked={listType === 'recieved'}
                    onChange={() => setListType('recieved')}
                />
                <label htmlFor="receivedMessages">Messages reçus</label>
            </div>
            <div>
                <input
                    type="radio"
                    name="messageType"
                    id="sentMessages"
                    value="sent"
                    checked={listType === 'sent'}
                    onChange={() => setListType('sent')}
                />
                <label htmlFor="sentMessages">Messages envoyés</label>
            </div>
        </div>
        <div>
            {Array.isArray(messages) && messages.map((message: Message) => (
            <div key={message._id} className={styles.messageItem} onClick={() => router.push(`/message/${message._id}`)} role="button">
                <div className={styles.messageHeader}>
                    {listType === 'recieved' ? (
                        <span className={!message.isRead ? styles.bold : ''}>De: {message.sender?.name}</span>
                            ) : (
                            <span>À: {message.recipient?.name}</span>
                            )}
                    <span className={styles.messageDate}>{new Date(message.createdAt).toLocaleDateString()}</span>
                </div>
                <div>
                    <span className={`${styles.messageSubject} ${!message.isRead ? styles.bold : ''}`}>{message.subject}</span>
                </div>
                <div className={`${styles.messageBody} ${!message.isRead ? styles.bold : ''}`}>
                    <p>{message.content}</p>
                </div>
            </div>
            ))}
            {!messages || messages.length === 0 && (
                <div className={styles.noMessages}>
                    <p>Aucun message {listType === 'received' ? 'reçu' : 'envoyé'}.</p>

                </div>
            )}
        </div>
    </div>
);

}