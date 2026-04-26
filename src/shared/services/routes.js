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
    },
    COMPANY:{
        ROOT: 'company',
        ONBOARDING: 'onboarding',
        HOME: 'home',
        STOPS: 'stops',
        ROUTES: 'routes',
        PROFILE: 'profile',
        INFORMATION: 'information',
        SUSCRIPTION: 'suscription'
    }
}