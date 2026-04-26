import { createRouter, createWebHistory } from 'vue-router'
import LoginView        from '@/access-and-identity/pages/Login.vue'
import RegisterView     from '@/access-and-identity/pages/Register.vue'
import CompanyRegisterView from '@/transport-company/pages/CompanyRegister.vue'
import RoutesPage       from '@/network/pages/RoutesPage.vue'
import RouteCompleteDetailsComponent from "@/discovery/pages/route-complete-details.component.vue"
import StopsPage        from "@/network/pages/StopsPage.vue"
import HomePage         from "@/transport-company/pages/HomePage.vue"
import CompanyLayout    from "@/shared/components/CompanyLayout.vue"
import RoutesList       from "@/discovery/components/routes-list/routes-list.vue"
import TravellerLayout  from "@/shared/components/TravellerLayout.vue"
import { APP_ROUTES }   from "@/shared/services/routes.js"
import CompanyInformation from "@/transport-company/pages/CompanyInformation.vue"
import Suscription      from "@/shared/components/Suscription.vue"

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
                component: () => import('@/collections/pages/CollectionsPage.vue')
            },
            {
                path: `${APP_ROUTES.TRAVELLER.ROOT}/${APP_ROUTES.TRAVELLER.TRIPS}`,
                name: "TripHistory",
                component: () => import('@/trips/pages/TripsHistoryPage.vue')
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
    /* COMPANY */
    {
        path: "/" + APP_ROUTES.COMPANY.ROOT,
        children: [
            {
                path: APP_ROUTES.COMPANY.ONBOARDING,
                component: CompanyRegisterView,
            },
            {
                path: "",
                component: CompanyLayout,
                children: [
                    { path: APP_ROUTES.COMPANY.HOME,        component: HomePage },
                    { path: APP_ROUTES.COMPANY.STOPS,       component: StopsPage },
                    { path: APP_ROUTES.COMPANY.ROUTES,      component: RoutesPage },
                    { path: APP_ROUTES.COMPANY.INFORMATION, component: CompanyInformation },
                    { path: APP_ROUTES.COMPANY.SUSCRIPTION, component: Suscription }
                ]
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
