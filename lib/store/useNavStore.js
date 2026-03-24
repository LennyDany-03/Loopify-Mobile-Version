import { create } from "zustand";

const useNavStore = create((set) => ({
  tabIndex: 0,
  setTabIndex: (index) => set({ tabIndex: index }),
}));

export default useNavStore;
