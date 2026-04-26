import {RegionService} from "@/geography/services/region.service.js";
import {ProvinceService} from "@/geography/services/province.service.js";
import {DistrictService} from "@/geography/services/district.service.js";

export class GeographyService {
    constructor() {
        this.regionService = new RegionService();
        this.provinceService = new ProvinceService();
        this.districtService = new DistrictService();
    }
    /**
     * Obtiene la jerarquía completa de ubicaciones
     * @returns {Promise<Array>} Jerarquía completa de regiones, provincias, distritos y localidades
     */
    async getFullHierarchy() {
        try {
            const [regions, provinces, districts] = await Promise.all([
                this.regionService.getAll(),
                this.provinceService.getAll(),
                this.districtService.getAll(),
            ]);

            return this._buildHierarchy(regions, provinces, districts);
        } catch (error) {
            console.error('Error loading location hierarchy:', error);
            throw new Error('Failed to load location hierarchy');
        }
    }

    /**
     * Obtiene los detalles completos de un distrito específico
     * @param {string} districtId - ID del distrito
     * @returns {Promise<Object>} Objeto con detalles completos de la ubicación
     */
    async getLocationDetails(districtId) {
        if (!districtId) {
            return this._getDefaultLocation();
        }

        try {
            const district = await this.districtService.getById(districtId);
            if (!district) return this._getDefaultLocation();

            const province = await this.provinceService.getById(district.fkIdProvince);
            if (!province) return this._getDefaultLocation();

            const region = await this.regionService.getById(province.fkIdRegion);
            return {
                district: district?.name || 'Desconocido',
                province: province?.name || 'Desconocido',
                region: region?.name || 'Desconocido',
                fullPath: this._buildFullPath(district, province, region)
            };
        } catch (error) {
            console.error('Error getting location details:', error);
            return this._getDefaultLocation();
        }
    }

    // Métodos privados auxiliares
    _buildHierarchy(regions, provinces, districts) {
        return regions.map(region => ({
            ...region,
            provinces: provinces
                .filter(province => province.fkIdRegion === region.id) //esto no esta mal, esta con los atributos del json q envia el backend
                .map(province => ({
                    ...province,
                    districts: districts
                        .filter(district => district.fkIdProvince === province.id)
                        .map(district => district)
                        }))
                }));
    }

    _buildFullPath(district, province, region) {
        const parts = [
            district?.name,
            province?.name,
            region?.name
        ].filter(Boolean);

        return parts.join(', ') || 'Ubicación desconocida';
    }

    _getDefaultLocation() {
        return {
            district: 'Desconocido',
            province: 'Desconocido',
            region: 'Desconocido',
            fullPath: 'Ubicación desconocida'
        };
    }
}