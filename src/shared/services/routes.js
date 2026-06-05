export const APP_ROUTES = {
    PUBLIC: {
        ROOT: "",

        ROUTES: "routes/:routeId"
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
        NOTIFICATIONS: 'notifications',
        RESERVATIONS: 'reservations',
        PLANS: 'plans',
        CHECKOUT: 'checkout',
    },
    CONDUCTOR:{
        ROOT: 'conductor',
        ONBOARDING: 'onboarding',
        HOME: 'home',
        STOPS: 'stops',
        ROUTES: 'routes',
        PROFILE: 'profile',
        INFORMATION: 'information',
        SUSCRIPTION: 'suscription',
        TARIFFS: 'tariffs',
        ANALYTICS: 'analytics'
    },
    ADMIN:{
        ROOT: 'admin',
        PLANS: 'plans',
        ANALYTICS: 'analytics'
    }
}