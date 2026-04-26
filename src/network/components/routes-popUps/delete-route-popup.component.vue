<script>
import { useConfirm } from 'primevue/useconfirm';
import { RouteService } from '@/network/services/route.service.js';
import { useToast } from 'primevue/usetoast';

export default {
  name: 'deleteRoutePopUp',

  props: {
    routeId: {
      type: String,
      required: true
    }
  },

  emits: ['update:value', 'deleted'],


  setup(props, {emit}) {
    const confirm = useConfirm();
    const toast = useToast();
    const service = new RouteService();

    const confirmDelete = () => {
      confirm.require({
        message: '¿Estás seguro de que quieres eliminar esta ruta?',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí',
        rejectLabel: 'No',
        accept: async () => {
          try {
            await service.delete(props.routeId);
            emit('deleted');
            toast.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Ruta eliminado',
              life: 3000
            });
          } catch (error) {
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error al eliminar ruta: ${error.message}`,
              life: 3000
            });
          }
        },
        reject: () => {
          // No hacer nada
        }
      });
    };
    return { confirmDelete };
  }
}

</script>

<template>
  <pb-Button icon="pi pi-trash"  class="delete-button" @click="confirmDelete" />
</template>

<style scoped>
</style>