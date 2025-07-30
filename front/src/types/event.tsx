interface CenterData {
    name: string;
    address: string;
    city: string;
    zipCode: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    hasEquipment: boolean;
    type: string;
    lastUpdated: string;
}

interface Event {
    _id: string;
    title: string;
    description: string;
    sport: string;
    date: string;
    startTime: string;
    endTime: string;
    maxParticipants: number;
    currentParticipants: number;
    status: 'active' | 'completed' | 'cancelled';
    centerId: string;
    centerData?: CenterData;
    creator: {
        name: string;
        surname: string;
    };
}

interface PaginationData {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

interface EventResponse {
    success: boolean;
    data: Event[];
    pagination: PaginationData;
}

interface CreatorEvent extends Event {
    participants: [
        {
            name: string;
            surname: string;
        }
    ];
}

type CreatorEventResponse = {
    success: boolean;
    data: CreatorEvent[];
    pagination: PaginationData;
};

interface ParticipantEvent extends Event {
    creator: {
        name: string;
        surname: string;
    };
}

type ParticipantEventResponse = {
    success: boolean;
    data: ParticipantEvent[];
    pagination: PaginationData;
};

export type { Event, EventResponse, CreatorEvent, CreatorEventResponse, ParticipantEvent, ParticipantEventResponse, CenterData, PaginationData };