import {BaseService} from '@/shared/services/base-service.js';

export class AuthService extends BaseService {
    constructor() {
        super('authentication');
    }

    async register(credentials) {
        try {

            // Validación básica antes de enviar
            //if (!credentials.username || !credentials.email || !credentials.password) {
            //    throw new Error('Datos de registro incompletos');
            //}
            const response = await this.http.post(`${this.resourcePath()}/sign-up`, {
                username: credentials.username,
                email: credentials.email,
                password: credentials.password,
                role: Number(credentials.role)
            });

            console.log('credentials', credentials);

            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    async login(credentials) {
        try {
            // Validación básica antes de enviar
            //if (!credentials.email || !credentials.password) {
            //    throw new Error('Datos de inicio de sesión incompletos');
            //}
            const response = await this.http.post(`${this.resourcePath()}/sign-in`, {
                email: credentials.email,
                password: credentials.password
            });
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }


}