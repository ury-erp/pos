<template>
   <Header />

  <div class="container mx-auto p-4 mb-16">
   
    <router-view></router-view>
  </div>

  <Tabs />
</template>

<script>
import { useAuthStore } from "@/stores/Auth.js";
import Tabs from "./components/bottomTabs.vue";
import Header from "./components/Header.vue";

export default {
  name: "App",
  components: {
    Tabs,
    Header,
  },
  setup() {
    const auth = useAuthStore();    
    return { auth };
  },
  mounted() {
    this.auth.fetchUserDetails();
    
  },
  computed: {
    isLoginPage() {
      return this.$route.path === "/";
    },
  },
};
</script>
