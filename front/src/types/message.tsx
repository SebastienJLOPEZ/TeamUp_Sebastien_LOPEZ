export interface Message {
    _id: string;
    sender?: {
        _id?: string;
        name: string;
        surname?: string;
    };
    recipient?: {
        name: string;
        surname: string;
    };
    subject: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}