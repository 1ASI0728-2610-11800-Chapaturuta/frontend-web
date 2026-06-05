import { createRouter, createWebHistory } from 'vue-router'
import LoginView        from '@/access-and-identity/pages/Login.vue'
import RegisterView     from '@/access-and-identity/pages/Register.vue'
import ConductorOnboarding from '@/conductor/pages/ConductorOnboarding.vue'
import RoutesPage       from '@/network/pages/RoutesPage.vue'
import RouteCompleteDetailsComponent from "@/discovery/pages/route-complete-details.component.vue"
import StopsPage        from "@/network/pages/StopsPage.vue"
import HomePage         from "@/conductor/pages/HomePage.vue"
import CompanyLayout    from "@/shared/components/CompanyLayout.vue"
import RoutesList       from "@/discovery/components/routes-list/routes-list.vue"
import TravellerLayout  from "@/shared/components/TravellerLayout.vue"
import { APP_ROUTES }   from "@/shared/services/routes.js"
import ConductorInformation from "@/conductor/pages/ConductorInformation.vue"

// Roles del backend (IAM Role.cs): Traveller=0, Driver=2, Admin=3
export const ROLE = { TRAVELLER: 0, DRIVER: 2, ADMIN: 3 }

// meta de conveniencia
const authAny  = { requiresAuth: true }                       // cualquier usuario autenticado
const driver   = { requiresAuth: true, roles: [ROLE.DRIVER, ROLE.ADMIN] }
const admin    = { requiresAuth: true, roles: [ROLE.ADMIN] }

const routes = [
    /* TRAVELLER / PUBLIC */
    {
        path: "/",
        component: TravellerLayout,
        children: [
            {
                path: "/test",
                component: RoutesList,
            },
            {
                path: APP_ROUTES.PUBLIC.ROUTES,
                name: "route-detail",
                component: RouteCompleteDetailsComponent,
                props: true
            },
            {
                path: APP_ROUTES.PUBLIC.ROOT,
                name: "Discovery",
                component: () => import('@/discovery/pages/routes-alpha-dashboard.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.COLLECTIONS}`,
                name: "Collections",
                meta: authAny,
                component: () => import('@/collections/pages/CollectionsPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.TRIPS}`,
                name: "TripHistory",
                meta: authAny,
                component: () => import('@/trips/pages/TripsHistoryPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.PROFILE}`,
                name: "TravellerProfile",
                meta: authAny,
                component: () => import('@/traveller/pages/TravellerProfilePage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.NOTIFICATIONS}`,
                name: "Notifications",
                meta: authAny,
                component: () => import('@/notifications/pages/NotificationsPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.RESERVATIONS}`,
                name: "MyReservations",
                meta: authAny,
                component: () => import('@/reservations/pages/MyReservationsPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.PLANS}`,
                name: "TravellerPlans",
                meta: authAny,
                component: () => import('@/subscriptions/pages/PlansPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.CHECKOUT}`,
                name: "Checkout",
                meta: authAny,
                component: () => import('@/payments/pages/CheckoutPage.vue'),
                props: route => ({ ...route.query })
            }
        ]
    },
    /* AUTH */
    {
        path: `/${APP_ROUTES.AUTH.ROOT}`,
        redirect: `/${APP_ROUTES.AUTH.ROOT}/${APP_ROUTES.AUTH.LOGIN}`,
        children: [
            {
                path: APP_ROUTES.AUTH.LOGIN,
                name: "LoginView",
                component: LoginView,
            },
            {
                path: APP_ROUTES.AUTH.REGISTER,
                component: RegisterView,
            },
        ]
    },
    /* CONDUCTOR (solo rol Driver/Admin) */
    {
        path: "/" + APP_ROUTES.CONDUCTOR.ROOT,
        meta: driver,
        children: [
            {
                path: APP_ROUTES.CONDUCTOR.ONBOARDING,
                name: "ConductorOnboarding",
                component: ConductorOnboarding,
            },
            {
                path: "",
                component: CompanyLayout,
                children: [
                    { path: APP_ROUTES.CONDUCTOR.HOME,        name: "ConductorHome",        component: HomePage },
                    { path: APP_ROUTES.CONDUCTOR.STOPS,       name: "ConductorStops",       component: StopsPage },
                    { path: APP_ROUTES.CONDUCTOR.ROUTES,      name: "ConductorRoutes",      component: RoutesPage },
                    { path: APP_ROUTES.CONDUCTOR.INFORMATION, name: "ConductorInformation", component: ConductorInformation },
                    { path: APP_ROUTES.CONDUCTOR.TARIFFS,     name: "ConductorTariffs",     component: () => import('@/tariffs/pages/TariffManagementPage.vue') },
                    { path: APP_ROUTES.CONDUCTOR.ANALYTICS,   name: "ConductorAnalytics",   component: () => import('@/discovery/pages/DemandAnalyticsPage.vue') },
                    { path: APP_ROUTES.CONDUCTOR.SUSCRIPTION, name: "ConductorSuscription", component: () => import('@/subscriptions/pages/PlansPage.vue') }
                ]
            }
        ]
    },
    /* ADMIN (solo rol Admin) */
    {
        path: "/" + APP_ROUTES.ADMIN.ROOT,
        meta: admin,
        children: [
            {
                path: APP_ROUTES.ADMIN.PLANS,
                name: "AdminPlans",
                component: () => import('@/subscriptions/pages/AdminPlansPage.vue')
            },
            {
                path: APP_ROUTES.ADMIN.ANALYTICS,
                name: "AdminAnalytics",
                component: () => import('@/discovery/pages/DemandAnalyticsPage.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

/** Home por defecto según rol */
function homeForRole(role) {
    if (role === ROLE.DRIVER) return '/conductor/home'
    if (role === ROLE.ADMIN)  return '/admin/plans'
    return '/'
}

/* Guard de autenticación y autorización por rol */
router.beforeEach((to) => {
    const requiresAuth = to.matched.some(r => r.meta?.requiresAuth)
    // roles requeridos: el más específico de la cadena de coincidencias
    const roles = to.matched.reduce((acc, r) => (r.meta?.roles ? r.meta.roles : acc), null)

    if (!requiresAuth && !roles) return true

    const token = localStorage.getItem('authToken')
    if (!token) {
        return { path: `/${APP_ROUTES.AUTH.ROOT}/${APP_ROUTES.AUTH.LOGIN}` }
    }

    let user = null
    try { user = JSON.parse(localStorage.getItem('user')) } catch { /* noop */ }
    const role = user?.role

    if (roles && !roles.includes(role)) {
        // autenticado pero sin permiso: lo mandamos a su home
        return homeForRole(role)
    }
    return true
})

export default router
