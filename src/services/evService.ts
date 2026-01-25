import axios from 'axios';

const API_KEY = '5d0a6888-b09d-44ac-8928-9865d0267a81'; // In prod use process.env
const BASE_URL = 'https://api.openchargemap.io/v3/poi/';

export interface EVStation {
    ID: number;
    AddressInfo: {
        Title: string;
        AddressLine1: string;
        Latitude: number;
        Longitude: number;
    };
    OperatorInfo?: {
        Title: string;
    };
    Connections?: Array<{
        PowerKW?: number;
        ConnectionType?: {
            Title: string;
        };
    }>;
}

export const EVService = {
    /**
     * Fetch EV Charging Stations for Cyprus
     */
    fetchStations: async (): Promise<EVStation[]> => {
        try {
            const response = await axios.get(BASE_URL, {
                params: {
                    key: API_KEY,
                    countrycode: 'CY',
                    maxresults: 100,
                    compact: true,
                    verbose: false
                },
                timeout: 5000 // 5s timeout
            });
            return response.data as EVStation[];
        } catch (error) {
            // Silently fail for UI, just log warning
            console.warn("EV Service currently unavailable (Mocking empty response).");
            return [];
        }
    }
};
