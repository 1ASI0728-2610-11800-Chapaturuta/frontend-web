import { BaseService } from '@/shared/services/base-service.js';

export class TransportCompanyService extends BaseService {
    constructor() {
        super('companies');
    }

    async getCompanyByFkUserId(userId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/user/${userId}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    async createCompany(companyData) {
        try {
            // Crear FormData para enviar archivos
            const formData = new FormData();

            // Agregar campos de texto
            formData.append('Name', companyData.name);
            formData.append('FkIdUser', companyData.fkIdUser.toString());

            // Agregar archivo si existe
            if (companyData.logoFile) {
                formData.append('LogoFile', companyData.logoFile);
            }

            const response = await this.http.post(this.resourcePath(), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    async createCompanyWithUrl(company) {
        try {
            // Método alternativo para crear empresa con URL (mantener compatibilidad)
            const response = await this.http.post(`${this.resourcePath()}/json`, {
                name: company.name,
                logoUrl: company.logo_url,
                fkIdUser: Number(company.fkIdUser)
            });

            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    async getCompanyById(companyId) {
        try {
            const response = await this.http.get(`${this.resourcePath()}/${companyId}`);
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    async updateCompany(companyId, companyData) {
        try {
            const response = await this.http.put(`${this.resourcePath()}/${companyId}`, {
                id: companyId,
                name: companyData.name,
                logoUrl: companyData.logoUrl,
                fkIdUser: Number(companyData.fkIdUser)
            });

            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }
}