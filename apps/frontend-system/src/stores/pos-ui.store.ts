import { create } from "zustand";

type PosUiState = {
  isOrderProcessOpen: boolean;
  isOrderQueueOpen: boolean;
  setOrderProcessOpen: (open: boolean) => void;
  setOrderQueueOpen: (open: boolean) => void;
};

export const usePosUiStore = create<PosUiState>((set) => ({
  isOrderProcessOpen: false,
  isOrderQueueOpen: false,
  setOrderProcessOpen: (open: boolean) => set({ isOrderProcessOpen: open }),
  setOrderQueueOpen: (open: boolean) => set({ isOrderQueueOpen: open }),
}));
