/**
 * Mapeo de System.DayOfWeek (.NET) usado por el backend en TariffResource.
 * El indice del array ES el valor entero del enum .NET:
 *   Sunday=0, Monday=1, Tuesday=2, Wednesday=3, Thursday=4, Friday=5, Saturday=6.
 *
 * El backend (System.Text.Json sin JsonStringEnumConverter) exige los dias como
 * ENTEROS en CreateTariffResource/UpdateTariffResource, y los DEVUELVE como
 * enteros en TariffResource.AvailableDays. Por eso convertimos:
 *   - string -> int al ENVIAR (toCreateResource/toUpdateResource)
 *   - int -> string al RECIBIR (constructor) para los checkboxes/SelectButton.
 */
const DAY_OF_WEEK_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Convierte un dia (string ingles o numero) al entero .NET DayOfWeek. */
export function dayOfWeekToInt(day) {
    if (typeof day === 'number') return day;
    const i = DAY_OF_WEEK_ORDER.indexOf(day);
    return i >= 0 ? i : 0;
}

/** Convierte un dia (numero .NET o string) al string ingles ('Monday'...). */
export function dayOfWeekToStr(day) {
    return typeof day === 'number' ? (DAY_OF_WEEK_ORDER[day] ?? 'Sunday') : (day ?? 'Sunday');
}

/**
 * Entidad Tariff. Campos camelCase EXACTOS de TariffResource
 * (Driver/Interfaces/REST/Resources/TariffResource.cs).
 * availableDays se modelan en el front como DayOfWeek string (Monday..Sunday);
 * la conversion a/desde el entero .NET del backend la hace esta entidad.
 */
export class Tariff {
    constructor({
                    id = null,
                    fkIdDriver = null,
                    baseFare = 0,
                    pricePerKm = 0,
                    pricePerMinute = 0,
                    minFare = 0,
                    currency = 'PEN',
                    availableDays = [],
                    isActive = true,
                    createdAt = null
                } = {}) {
        this.id = id;
        this.fkIdDriver = fkIdDriver;
        this.baseFare = baseFare;
        this.pricePerKm = pricePerKm;
        this.pricePerMinute = pricePerMinute;
        this.minFare = minFare;
        this.currency = currency;
        // El backend devuelve availableDays como enteros .NET DayOfWeek; los
        // normalizamos a string ('Monday'...) para el SelectButton del UI.
        this.availableDays = Array.isArray(availableDays)
            ? availableDays.map(dayOfWeekToStr)
            : [];
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    /**
     * Construye el CreateTariffResource para POST api/v1/tariffs.
     * @returns {Object} CreateTariffResource (casing backend)
     */
    toCreateResource() {
        return {
            fkIdDriver: this.fkIdDriver,
            baseFare: this.baseFare,
            pricePerKm: this.pricePerKm,
            pricePerMinute: this.pricePerMinute,
            minFare: this.minFare,
            currency: this.currency || 'PEN',
            // string ('Monday'...) -> int .NET DayOfWeek esperado por el backend.
            availableDays: (this.availableDays ?? []).map(dayOfWeekToInt)
        };
    }

    /**
     * Construye el UpdateTariffResource para PATCH api/v1/tariffs/{id}.
     * @returns {Object} UpdateTariffResource (casing backend)
     */
    toUpdateResource() {
        return {
            baseFare: this.baseFare,
            pricePerKm: this.pricePerKm,
            pricePerMinute: this.pricePerMinute,
            minFare: this.minFare,
            // string ('Monday'...) -> int .NET DayOfWeek esperado por el backend.
            availableDays: (this.availableDays ?? []).map(dayOfWeekToInt)
        };
    }
}
