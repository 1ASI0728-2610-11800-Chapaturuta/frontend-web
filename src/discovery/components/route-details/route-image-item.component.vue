<script>
export default {
  name: "route-image-item",
  props: {
    images: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      activeIndex: 0
    }
  },
  methods: {
    nextImage() {
      if (this.images.length > 0) {
        this.activeIndex = (this.activeIndex + 1) % this.images.length;
      }
    },
    prevImage() {
      if (this.images.length > 0) {
        this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
      }
    }
  }
}
</script>

<template>
  <div class="route-images-container">
    <div v-if="images && images.length > 0" class="image-gallery">
      <button class="gallery-nav prev" @click="prevImage">
        <i class="pi pi-chevron-left"></i>
      </button>

      <div class="image-container">
        <img :src="images[activeIndex]" :alt="`Route image ${activeIndex + 1}`" class="route-image" />
      </div>

      <button class="gallery-nav next" @click="nextImage">
        <i class="pi pi-chevron-right"></i>
      </button>
    </div>

    <div v-else class="placeholder-images">
      <div class="placeholder-image">
        <img src="/placeholder.svg" alt="Route image placeholder" class="route-image" />
      </div>
      <div class="placeholder-image">
        <img src="/placeholder.svg" alt="Route image placeholder" class="route-image" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-images-container {
  width: 100%;
  margin-bottom: 30px;
}

.image-gallery {
  position: relative;
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 8px;
  background-color: #f0f2f5;
}

.route-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: rgba(255, 255, 255, 0.7);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;

  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}

.gallery-nav.prev {
  left: 10px;
}

.gallery-nav.next {
  right: 10px;
}

.placeholder-images {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.placeholder-image {
  height: 300px;
  background-color: #f0f2f5;
  border-radius: 8px;
  overflow: hidden;
}
</style>