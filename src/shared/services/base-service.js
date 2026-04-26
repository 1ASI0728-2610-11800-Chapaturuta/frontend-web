import axios from 'axios';

export class BaseService {
    /**
     * @param {string} resourceEndpoint - Endpoint path
     * @param {Object} options - Configuration options
     * @param {Object} httpClient - HTTP client instance (default: axios)
     */
    constructor( resourceEndpoint = '/resources', options = {}, httpClient = axios) {
        this.serverBaseUrl = import.meta.env.VITE_API_BASE_URL;
        this.resourceEndpoint = resourceEndpoint;
        this.http = httpClient;
        this.retries = options.retries || 2;
        this.timeout = options.timeout || 5000;

        // Configure HTTP client
        this.http.defaults.timeout = this.timeout;
        this.http.defaults.headers.common['Content-Type'] = 'application/json';

        // Setup interceptors
        this._setupRequestInterceptor();
        this._setupResponseInterceptor();
    }

    /**
     * Sets up request interceptor for auth headers
     */
    _setupRequestInterceptor() {
        this.http.interceptors.request.use(config => {
            // Add auth token if exists
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, error => {
            return Promise.reject(error);
        });
    }

    /**
     * Sets up response interceptor for error handling
     */
    _setupResponseInterceptor() {
        this.http.interceptors.response.use(
            response => response,
            error => {
                return Promise.reject(this._enhanceError(error));
            }
        );
    }

    /**
     * Enhances error object with additional context
     * @param {Error} error
     * @returns {EnhancedError}
     */
    _enhanceError(error) {
        const enhancedError = new Error(error.message);
        enhancedError.status = error.response?.status;
        enhancedError.data = error.response?.data;
        enhancedError.config = error.config;
        return enhancedError;
    }

    /**
     * Constructs full resource URL
     * @returns {string}
     */
    resourcePath() {
        return `${this.serverBaseUrl}${this.resourceEndpoint}`;
    }

    /**
     * Creates a resource
     * @param {Object} resource
     * @returns {Promise}
     */
    async create(resource) {
        try {
            const response = await this.http.post(
                this.resourcePath(),
                JSON.stringify(resource)
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Deletes a resource
     * @param {string|number} id
     * @returns {Promise}
     */
    async delete(id) {
        try {
            console.log(`${this.resourcePath()}/${id}`)
            const response = await this.http.delete(
                `${this.resourcePath()}/${id}`
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Updates a resource
     * @param {string|number} id
     * @param {Object} resource
     * @returns {Promise}
     */
    async update(id, resource) {
        try {
            const response = await this.http.put(
                `${this.resourcePath()}/${id}`,
                JSON.stringify(resource)
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Gets all resources
     * @returns {Promise<Array>}
     */
    async getAll() {
        try {
            const response = await this.http.get(this.resourcePath());
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }

    /**
     * Gets resource by ID
     * @param {string|number} id
     * @returns {Promise}
     */
    async getById(id) {
        try {
            const response = await this.http.get(
                `${this.resourcePath()}/${id}`
            );
            return response.data;
        } catch (error) {
            throw this._enhanceError(error);
        }
    }
}