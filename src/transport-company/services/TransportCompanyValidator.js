export class TransportCompanyValidator {
    static validateEmail(email) {
        if (!email) return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    }

    static validateRUC(ruc) {
        if (!ruc) return false;
        const cleanedRUC = ruc.toString().replace(/\D/g, '');
        return cleanedRUC.length === 11 && /^\d+$/.test(cleanedRUC);
    }

    static validatePhone(phone) {
        if (!phone) return false;
        const cleanedPhone = phone.toString().replace(/\D/g, '');
        return cleanedPhone.length >= 9 && cleanedPhone.length <= 15;
    }

    static validate(companyData) {
        const errorMessages = [];
        const requiredFields = ['name', 'ruc', 'phone', 'email', 'address'];

        // Validar campos requeridos
        requiredFields.forEach(field => {
            if (!companyData[field]?.toString().trim()) {
                errorMessages.push(`El ${this.fieldNames[field]} es requerido`);
            }
        });

        // Validaciones específicas solo si el campo existe
        if (companyData.ruc) {
            if (!this.validateRUC(companyData.ruc)) {
                errorMessages.push('El RUC debe tener exactamente 11 dígitos numéricos');
            }
        }

        if (companyData.email) {
            if (!this.validateEmail(companyData.email)) {
                errorMessages.push('Ingrese un email válido (ejemplo: correo@dominio.com)');
            }
        }

        if (companyData.phone) {
            if (!this.validatePhone(companyData.phone)) {
                errorMessages.push('El teléfono debe tener entre 9 y 15 dígitos');
            }
        }

        return errorMessages;
    }

    static fieldNames = {
        name: 'nombre de la empresa',
        ruc: 'RUC',
        phone: 'teléfono',
        email: 'email',
        address: 'dirección'
    };
}