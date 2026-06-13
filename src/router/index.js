import { createRouter, createWebHistory } from 'vue-router'
import LoginView        from '@/access-and-identity/pages/Login.vue'
import RegisterView     from '@/access-and-identity/pages/Register.vue'
import RoutesPage       from '@/network/pages/RoutesPage.vue'
import RouteCompleteDetailsComponent from "@/discovery/pages/route-complete-details.component.vue"
import StopsPage        from "@/network/pages/StopsPage.vue"
import DriverOnboardingPage from '@/driver/pages/DriverOnboardingPage.vue'
import DriverHomePage   from "@/driver/pages/DriverHomePage.vue"
import DriverLayout     from "@/shared/components/DriverLayout.vue"
import RoutesList       from "@/discovery/components/routes-list/routes-list.vue"
import TravellerLayout  from "@/shared/components/TravellerLayout.vue"
import { APP_ROUTES }   from "@/shared/services/routes.js"
import DriverInformationPage from "@/driver/pages/DriverInformationPage.vue"
import DriverDashboardPage from "@/driver/pages/DriverDashboardPage.vue"
import PaymentsPage from "@/payments/pages/PaymentsPage.vue"
import SubscriptionsPage from "@/subscriptions/pages/SubscriptionsPage.vue"
import { DriverService } from "@/driver/services/driver.service.js"
import { getCurrentUser, getDriverId, saveCurrentUser } from "@/shared/services/session.service.js"

const routes = [
    /* PAGO EXITOSO (publico, sin layout — destino del QR escaneable) */
    {
        path: `/${APP_ROUTES.PUBLIC.PAYMENT_SUCCESS}`,
        name: "PaymentSuccess",
        component: () => import('@/payments/pages/PaymentSuccessPage.vue')
    },
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
                component: () => import('@/collections/pages/CollectionsPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.TRIPS}`,
                name: "TripHistory",
                component: () => import('@/trips/pages/TripsHistoryPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.RESERVATIONS}`,
                name: "Reservations",
                component: () => import('@/reservations/pages/ReservationsPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.PROFILE}`,
                name: "TravellerProfile",
                component: () => import('@/traveller/pages/TravellerProfilePage.vue')
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
    /* DRIVER */
    {
        path: "/" + APP_ROUTES.DRIVER.ROOT,
        children: [
            {
                path: APP_ROUTES.DRIVER.ONBOARDING,
                component: DriverOnboardingPage,
            },
            {
                path: "",
                component: DriverLayout,
                children: [
                    { path: APP_ROUTES.DRIVER.HOME,          component: DriverHomePage },
                    { path: APP_ROUTES.DRIVER.DASHBOARD,     component: DriverDashboardPage },
                    { path: APP_ROUTES.DRIVER.STOPS,         component: StopsPage },
                    { path: APP_ROUTES.DRIVER.ROUTES,        component: RoutesPage },
                    { path: APP_ROUTES.DRIVER.INFORMATION,   component: DriverInformationPage },
                    { path: APP_ROUTES.DRIVER.PAYMENTS,      component: PaymentsPage },
                    { path: APP_ROUTES.DRIVER.SUBSCRIPTIONS, component: SubscriptionsPage }
                ]
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to) => {
    const isDriverRoute = to.path.startsWith(`/${APP_ROUTES.DRIVER.ROOT}`)
    const isOnboarding = to.path === `/${APP_ROUTES.DRIVER.ROOT}/${APP_ROUTES.DRIVER.ONBOARDING}`
    if (!isDriverRoute || isOnboarding) return true

    const user = getCurrentUser()
    if (Number(user.role) !== 2) return true
    if (getDriverId()) return true

    try {
        const driver = await new DriverService().getDriverByUserId(user.id)
        saveCurrentUser({ ...user, driverId: driver.id })
        return true
    } catch {
        return `/${APP_ROUTES.DRIVER.ROOT}/${APP_ROUTES.DRIVER.ONBOARDING}`
    }
})

export default router
