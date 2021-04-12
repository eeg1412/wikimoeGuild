import { createStore } from 'vuex'

export default createStore({
  state: {
    token: ""
  },
  mutations: {
    setToken(state, data) {
      state.token = data;
    }
  },
  actions: {
  },
  modules: {
  }
})
