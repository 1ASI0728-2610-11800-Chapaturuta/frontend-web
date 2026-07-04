import { createApp } from 'vue'
import App from './App.vue'

// i18n
import { i18n } from '@/i18n/i18n.js'

// PrimeVue + theme
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

// PrimeVue services
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'

// PrimeVue components
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Message from 'primevue/message'
import SplitButton from 'primevue/splitbutton'
import ProgressSpinner from 'primevue/progressspinner'
import Select from 'primevue/select'
import IftaLabel from 'primevue/iftalabel'
import CascadeSelect from 'primevue/cascadeselect'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ColumnGroup from 'primevue/columngroup'
import Row from 'primevue/row'
import Image from 'primevue/image'
import { Form } from '@primevue/forms'
import AutoComplete from 'primevue/autocomplete'
import Chart from 'primevue/chart'

// Styles
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import '@/assets/styles/variables.css'

// Router
import router from './router'

// Build PurpleLight theme on top of Aura — light surfaces, light-purple primary.
const PurpleLight = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#EDE9FE',
      100: '#DDD6FE',
      200: '#C4B5FD',
      300: '#A78BFA',
      400: '#8B5CF6',
      500: '#7C3AED',
      600: '#6D28D9',
      700: '#5B21B6',
      800: '#4C1D95',
      900: '#3B1671',
      950: '#2A1055',
    },
    colorScheme: {
      light: {
        primary: {
          color:        '{primary.500}',
          inverseColor: '#FFFFFF',
          hoverColor:   '{primary.600}',
          activeColor:  '{primary.700}',
        },
      }
    }
  }
})

// Force remove stale auth on startup
localStorage.removeItem('auth_token')

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: PurpleLight,
    options: {
      prefix: 'p',
      // Inert selector: never applied, so PrimeVue stays in its LIGHT color scheme.
      darkModeSelector: '.app-dark',
      cssLayer: false
    }
  }
})

app.use(i18n)
app.use(router)
app.use(ToastService)
app.use(ConfirmationService)

// Register components
app.component('pb-Toast', Toast)
app.component('pb-ConfirmDialog', ConfirmDialog)
app.component('pb-Toolbar', Toolbar)
app.component('pb-Button', Button)
app.component('pb-SelectButton', SelectButton)
app.component('pb-Card', Card)
app.component('pb-Dialog', Dialog)
app.component('pb-InputText', InputText)
app.component('pb-InputNumber', InputNumber)
app.component('pb-Message', Message)
app.component('pb-SplitButton', SplitButton)
app.component('pb-ProgressSpinner', ProgressSpinner)
app.component('pb-Select', Select)
app.component('pb-IftaLabel', IftaLabel)
app.component('pb-CascadeSelect', CascadeSelect)
app.component('pb-DataTable', DataTable)
app.component('pb-Column', Column)
app.component('pb-ColumnGroup', ColumnGroup)
app.component('pb-Row', Row)
app.component('pb-Image', Image)
app.component('pb-Form', Form)
app.component('pb-AutoComplete', AutoComplete)
app.component('pb-Chart', Chart)

app.mount('#app')
