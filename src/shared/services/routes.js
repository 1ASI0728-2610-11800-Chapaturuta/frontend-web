export const APP_ROUTES = {
    PUBLIC: {
        ROOT: "",

        ROUTES: "routes/:routeId",
        PAYMENT_SUCCESS: "pago-exitoso"
    },
    AUTH:{
        ROOT: 'auth',
        LOGIN: 'login',
        REGISTER: 'register'
    },
    TRAVELLER:{
        ROOT: 'traveller',

        COLLECTIONS: 'collections',
        COLLECTION: 'collection/:collectionId',
        PROFILE: 'profile',
        TRIPS: 'trips',
        RESERVATIONS: 'reservations',
    },
    DRIVER:{
        ROOT: 'driver',
        ONBOARDING: 'onboarding',
        HOME: 'home',
        STOPS: 'stops',
        ROUTES: 'routes',
        INFORMATION: 'information',
        PAYMENTS: 'payments',
        SUBSCRIPTIONS: 'subscriptions'
    }
}
