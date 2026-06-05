import { Reservation } from '../models/reservation.entity.js';

/**
 * Assembler del contexto Reservations.
 *
 * El backend (System.Text.Json sin JsonStringEnumConverter) maneja los enums
 * como ENTEROS (indice de declaracion), tanto en los request bodies como en
 * las respuestas de ReservationResource (DocumentType y Status viajan como int).
 *
 * Por eso:
 *   - fromEntityToCreateResource: string -> int al ENVIAR (CreateReservationResource).
 *   - fromResponseToEntity: int -> string al RECIBIR (para badges/labels en el UI).
 *
 * Sigue el mismo patron de conductor.assembler.js (tablas `static` + helpers
 * `_xToInt` / `_xToStr` indexados por orden de declaracion del enum .cs).
 *
 * Indices confirmados leyendo los .cs y verificados con curl contra :5027:
 *   DocumentType.cs:      Dni=0 (UNICO valor; NO existe "Ce")
 *   ReservationStatus.cs: Pending=0, Confirmed=1, Cancelled=2, Completed=3, Refunded=4
 *   PaymentMethod.cs:     Yape=0, Plin=1, Card=2, Cash=3
 */
export class ReservationAssembler {
    static DOCUMENT_TYPES = ['Dni'];
    static RESERVATION_STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed', 'Refunded'];
    static PAYMENT_METHODS = ['Yape', 'Plin', 'Card', 'Cash'];

    static _documentTypeToInt(t) {
        const i = this.DOCUMENT_TYPES.indexOf(t);
        return i >= 0 ? i : 0;
    }
    static _documentTypeToStr(v) {
        return typeof v === 'number' ? (this.DOCUMENT_TYPES[v] ?? 'Dni') : (v ?? 'Dni');
    }
    static _statusToStr(v) {
        return typeof v === 'number' ? (this.RESERVATION_STATUSES[v] ?? 'Pending') : (v ?? 'Pending');
    }
    static _paymentMethodToInt(m) {
        const i = this.PAYMENT_METHODS.indexOf(m);
        return i >= 0 ? i : 0;
    }

    /**
     * Convierte la respuesta del API (ReservationResource) en una entidad
     * Reservation, normalizando documentType y status de int -> string para
     * que el UI muestre las etiquetas correctas.
     * @param {Object} apiData - ReservationResource (camelCase, enums como int)
     * @returns {Reservation}
     */
    static fromResponseToEntity(apiData) {
        if (!apiData) {
            throw new Error('Se requieren datos del API para construir una Reservation');
        }
        return new Reservation({
            id: apiData.id ?? null,
            fkIdUser: apiData.fkIdUser ?? null,
            fkIdTrip: apiData.fkIdTrip ?? null,
            documentType: this._documentTypeToStr(apiData.documentType),
            documentNumber: apiData.documentNumber ?? '',
            seats: apiData.seats ?? 1,
            status: this._statusToStr(apiData.status),
            fkIdPayment: apiData.fkIdPayment ?? null,
            reservedAt: apiData.reservedAt ?? null,
            confirmedAt: apiData.confirmedAt ?? null
        });
    }

    /**
     * Convierte los datos del formulario en CreateReservationResource para el
     * POST, mapeando documentType y paymentMethod de string -> int.
     * @param {Object} form - { fkIdUser, fkIdTrip, documentType, documentNumber, seats, paymentMethod }
     * @returns {Object} CreateReservationResource (enums como int)
     */
    static fromEntityToCreateResource(form) {
        return {
            fkIdUser: form.fkIdUser != null ? Number(form.fkIdUser) : null,
            fkIdTrip: form.fkIdTrip != null ? Number(form.fkIdTrip) : null,
            documentType: ReservationAssembler._documentTypeToInt(form.documentType),
            documentNumber: form.documentNumber,
            seats: Number(form.seats),
            paymentMethod: ReservationAssembler._paymentMethodToInt(form.paymentMethod)
        };
    }
}
