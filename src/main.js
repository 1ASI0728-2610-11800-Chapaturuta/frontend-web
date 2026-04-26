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

// Styles
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import '@/assets/styles/variables.css'

// Router
import router from './router'

// Build CarbonGold theme on top of Aura
const CarbonGold = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#F5ECD0',
      100: '#F5ECD0',
      200: '#E0C96E',
      300: '#E0C96E',
      400: '#D4B85C',
      500: '#C9A84C',
      600: '#B8943F',
      700: '#9A7832',
      800: '#7A5E27',
      900: '#5A441C',
      950: '#3A2C12',
    },
    colorScheme: {
      dark: {
        surface: {
          0:   '#0A0A0A',
          50:  '#1A1A1A',
          100: '#2D2D2D',
          200: '#3D3D3D',
          300: '#4A4A4A',
          400: '#8A8A8A',
          500: '#D4D4D4',
          600: '#E8E8E8',
          700: '#F5F5F5',
          800: '#F5F5F5',
          900: '#F5F5F5',
          950: '#F5F5F5',
        },
        primary: {
          color:         '{primary.500}',
          inverseColor:  '#0A0A0A',
          hoverColor:    '{primary.400}',
          activeColor:   '{primary.600}',
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
    preset: CarbonGold,
    options: {
      prefix: 'p',
      darkModeSelector: ':root',
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

app.mount('#app')
