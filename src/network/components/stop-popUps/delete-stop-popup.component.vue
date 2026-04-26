<script>
import { useConfirm } from 'primevue/useconfirm';
import { StopService } from '@/network/services/stop.service.js';
import { useToast } from 'primevue/usetoast';

export default {
  name: 'deleteStopPopUp',

  props: {
    stopId: {
      type: String,
      required: true
    }
  },

  emits: ['update:value', 'deleted'],


  setup(props, {emit}) {
    const confirm = useConfirm();
    const toast = useToast();
    const service = new StopService();

    const confirmDelete = () => {
      confirm.require({
        message: '¿Estás seguro de que quieres eliminar este paradero?',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí',
        rejectLabel: 'No',
        accept: async () => {
          try {
            await service.deleteStop(props.stopId);
            emit('deleted');
            toast.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Paradero eliminado',
              life: 3000
            });
          } catch (error) {
            toast.add({
              severity: 'error',
              summary: 'Error',
              detail: `Error al eliminar paradero: ${error.message}`,
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
.delete-button{
  background-color: #FF2C2C;
  border-color: transparent;
}

.delete-button.p-button:hover {
  background-color: lightcoral;
  border-color: transparent;
}
</style>