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

// Styles
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import '@/assets/styles/variables.css'

// Router
import router from './router'

// Tema claro "Lila pastel" sobre Aura (blanco + lila)
const LilacLight = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#F3EFFB',
      100: '#E7DFF6',
      200: '#D8CEF2',
      300: '#C9BBEC',
      400: '#C0AFE7',
      500: '#B7A6E0',
      600: '#9A86C9',
      700: '#806BB3',
      800: '#66539A',
      900: '#4D3D78',
      950: '#322750',
    },
    colorScheme: {
      light: {
        surface: {
          0:   '#FFFFFF',
          50:  '#FAFAFC',
          100: '#F4F2F9',
          200: '#ECE7F5',
          300: '#DED7EC',
          400: '#9B93AE',
          500: '#6E6780',
          600: '#4A4458',
          700: '#332E40',
          800: '#272233',
          900: '#1F1B2E',
          950: '#161320',
        },
        primary: {
          color:         '{primary.500}',
          inverseColor:  '#FFFFFF',
          hoverColor:    '{primary.600}',
          activeColor:   '{primary.700}',
        },
      }
    }
  }
})

// (limpieza de token obsoleto eliminada: la clave correcta es 'authToken' y se gestiona en login/logout)

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: LilacLight,
    options: {
      prefix: 'p',
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

app.mount('#app')
