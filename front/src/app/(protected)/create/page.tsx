'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // Importing the API instance
import styles from './create.module.css'; // Assuming you have a CSS module for styles
import { Center } from '@/types/center';
import { User } from '@/types/user';

export default function CreatePage() {
    const [step, setStep] = useState(''); // Step permet de suivre l'étape actuelle du formulaire de création d'évènement
    const [centers, setCenters] = useState<Center[]>([]);
    const [location, setLocation] = useState<string>('');
    const [distance, setDistance] = useState<string>('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        sport: '',
        date: '',
        startTime: '',
        endTime: '',
        maxParticipants: 0,
        centerId: '',
    });
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if((name==='sport' || name==='location') &&
        formData.sport && location) {
            setStep('2');
            fetchCenters();
        }
    };

    const fetchCenters = async () => {
        try {
            const response = await fetch(`${process.env.API_BASE_URL}/api/explore/v2.1/catalog/datasets/data-es/records&location=${location}`);
            if (!response.ok) throw new Error('Erreur réseau');
            const data = await response.json();
            setCenters(data);
        } catch (error) {
            console.error('Erreur lors de la récupération des centres :', error);
        }
    };

    const fetchLocationLonLat = async (query: string, distanceKm: number = 10) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
            const data = await response.json();
            if (!data || data.length === 0) {
                throw new Error('Localisation non trouvée');
            }
            const { lat, lon } = data[0];

            const latNum = parseFloat(lat);
            const lonNum = parseFloat(lon);
            const latDelta = distanceKm / 111;
            const lonDelta = distanceKm / (111 * Math.cos(latNum * Math.PI / 180));

            return {
                minLat: latNum - latDelta,
                maxLat: latNum + latDelta,
                minLon: lonNum - lonDelta,
                maxLon: lonNum + lonDelta,
                center: { lat: latNum, lon: lonNum }
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des coordonnées :', error);
            return null;
        }
    };

    const isFormValid = () => {
        return formData.title && formData.sport &&
            formData.centerId && formData.date &&
            formData.startTime && formData.endTime;
    };

    return (
        <div>
            <div>
                <h1>Créer un événement</h1>
            </div>
            <div>
                <input type="text" name='title' value={formData.title} onChange={handleChange} placeholder="Titre de l'événement" />
                <input type="text" name="sport" value={formData.sport} onChange={handleChange} placeholder="Sport" />
                <input type="text" name="location" value={location} onChange={handleChange} placeholder="Localisation" />
                <select name="distance" value={distance} onChange={handleChange}>
                    <option value="">Sélectionner une distance</option>
                    <option value="5">5 km</option>
                    <option value="10">10 km</option>
                    <option value="20">20 km</option>
                </select>
            </div>
        </div>
        
    )
};