export interface Center {
    id: string;
    name: string;
    address: string;
    city: string;
    Zipcode: string;
    coordinates: {
        lat: number;
        lng: number;
    };
    hasEquipment: boolean;
    type: string;
}