import './index.css';
import { createApp, reactive } from "vue";
import App from "./App.vue";

import { useAuthStore } from "@/stores/Auth.js";
import router from './router';
import resourceManager from "../../../doppio/libs/resourceManager";
import call from "../../../doppio/libs/controllers/call";
import socket from "../../../doppio/libs/controllers/socket";
import Auth from "../../../doppio/libs/controllers/auth";
import { createPinia } from 'pinia'


const pinia = createPinia()
const app = createApp(App);
const auth = reactive(new Auth());

// Plugins
app.use(router);
app.use(pinia)
app.use(resourceManager);

// Global Properties,
// components can inject this
app.provide("$auth", auth);
app.provide("$call", call);
app.provide("$socket", socket);


router.beforeEach((to, from, next) => {
	const auth = useAuthStore();
	const isAuthenticated = auth.userAuth
	
	if (to.name !== 'Login' && !isAuthenticated) {
	  next({ name: 'Login' });
	} else if (to.name === 'Login' && isAuthenticated) {
	  next({ name: 'Table' }); 
		  } else {
	  next();
	}
  });

app.mount("#app");
