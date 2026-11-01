import axios from 'axios';



export class ApplicationService{

    async initHandshake(sourceUrl: string, secret: any) {
        try {
            console.log("calling endpoint: "+ sourceUrl + "/handshake?secretKey=" + secret)
            const response = await axios.get(sourceUrl + "/handshake?secretKey=" + secret);
            return response.data;
        } catch (error) {
            console.error('Error initializing handshake:', error);
            throw error;
        }
    }
}

export const applicationService = new ApplicationService();