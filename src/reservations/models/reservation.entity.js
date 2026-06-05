/**
 * Entidad Reservation (Reserva de asientos). Campos camelCase EXACTOS de
 * ReservationResource (Trips/Interfaces/REST/Resources/ReservationResource.cs).
 *
 * Forma del backend (ReservationResource):
 *   Id, FkIdUser, FkIdTrip, DocumentType, DocumentNumber, Seats,
 *   Status, FkIdPayment?, ReservedAt, ConfirmedAt?
 * ASP.NET Core serializa a JSON en camelCase por defecto, por lo que aqui
 * usamos camelCase para que coincida con la respuesta real.
 */

/** Valores del campo Status (ReservationStatus del backend). */
export const RESERVATION_STATUS = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
    REFUNDED: 'Refunded'
}

/**
 * Valores del campo DocumentType (DocumentType del backend).
 * El backend SOLO define DocumentType.Dni (indice 0); no existe 'Ce'.
 * La conversion string->int la realiza ReservationAssembler al enviar.
 */
export const DOCUMENT_TYPE = {
    DNI: 'Dni'
}

/**
 * Metodos de pago aceptados al crear la reserva (PaymentMethod del backend).
 * El metodo se envia en CreateReservationResource; el pago en si lo gestiona
 * el modulo de payments tras crear la reserva.
 */
export const PAYMENT_METHOD = {
    YAPE: 'Yape',
    PLIN: 'Plin',
    CARD: 'Card',
    CASH: 'Cash'
}

export class Reservation {
    constructor({
                    id = null,
                    fkIdUser = null,
                    fkIdTrip = null,
                    documentType = DOCUMENT_TYPE.DNI,
                    documentNumber = '',
                    seats = 1,
                    status = RESERVATION_STATUS.PENDING,
                    fkIdPayment = null,
                    reservedAt = null,
                    confirmedAt = null
                } = {}) {
        this.id = id;
        this.fkIdUser = fkIdUser;
        this.fkIdTrip = fkIdTrip;
        this.documentType = documentType;
        this.documentNumber = documentNumber;
        this.seats = seats;
        this.status = status;
        this.fkIdPayment = fkIdPayment;
        this.reservedAt = reservedAt;
        this.confirmedAt = confirmedAt;
    }

    /** true si la reserva aun puede confirmarse (esta pendiente). */
    get isPending() {
        return this.status === RESERVATION_STATUS.PENDING;
    }

    /** true si la reserva sigue activa (no cancelada ni reembolsada). */
    get isActive() {
        return this.status !== RESERVATION_STATUS.CANCELLED
            && this.status !== RESERVATION_STATUS.REFUNDED;
    }

    /** true si la reserva puede cancelarse (pendiente o confirmada). */
    get isCancellable() {
        return this.status === RESERVATION_STATUS.PENDING
            || this.status === RESERVATION_STATUS.CONFIRMED;
    }
}
