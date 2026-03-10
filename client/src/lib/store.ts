/**
 * PROD-BOT Zustand Store
 * Centralized state management for user profile, wishlist, chat, and products
 */

import { create } from "zustand";
import { Product } from "./mockApi";

export interface UserProfile {
  id?: string;
  email?: string;
  name?: string;
  dob?: string;
  gender?: "male" | "female" | "non-binary" | "prefer-not";
  interests: string[];
  isGuest: boolean;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

interface AppStore {
  // User Profile
  user: UserProfile;
  setUser: (user: Partial<UserProfile>) => void;
  updateInterests: (interests: string[]) => void;
  logout: () => void;

  // Wishlist
  wishlist: string[]; // Product IDs
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Chat
  currentThread: ChatThread | null;
  threads: ChatThread[];
  createThread: (title: string) => void;
  addMessage: (message: ChatMessage) => void;
  switchThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;

  // Product Selection & Comparison
  selectedProducts: string[]; // Product IDs for comparison
  toggleProductSelection: (productId: string) => void;
  clearSelection: () => void;
  isProductSelected: (productId: string) => boolean;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const initialUser: UserProfile = {
  interests: [],
  isGuest: true,
};

export const useAppStore = create<AppStore>((set, get) => ({
  // User Profile
  user: initialUser,
  setUser: (updates) =>
    set((state) => ({
      user: { ...state.user, ...updates },
    })),
  updateInterests: (interests) =>
    set((state) => ({
      user: { ...state.user, interests },
    })),
  logout: () =>
    set({
      user: initialUser,
      wishlist: [],
      selectedProducts: [],
      threads: [],
      currentThread: null,
    }),

  // Wishlist
  wishlist: [],
  addToWishlist: (productId) =>
    set((state) => {
      if (!state.wishlist.includes(productId)) {
        return { wishlist: [...state.wishlist, productId] };
      }
      return state;
    }),
  removeFromWishlist: (productId) =>
    set((state) => ({
      wishlist: state.wishlist.filter((id) => id !== productId),
    })),
  isInWishlist: (productId) => get().wishlist.includes(productId),

  // Chat
  currentThread: null,
  threads: [],
  createThread: (title) =>
    set((state) => {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      return {
        threads: [newThread, ...state.threads],
        currentThread: newThread,
      };
    }),
  addMessage: (message) =>
    set((state) => {
      if (!state.currentThread) return state;
      const updatedThread = {
        ...state.currentThread,
        messages: [...state.currentThread.messages, message],
        updatedAt: Date.now(),
      };
      return {
        currentThread: updatedThread,
        threads: state.threads.map((t) =>
          t.id === updatedThread.id ? updatedThread : t
        ),
      };
    }),
  switchThread: (threadId) =>
    set((state) => {
      const thread = state.threads.find((t) => t.id === threadId);
      return { currentThread: thread || null };
    }),
  deleteThread: (threadId) =>
    set((state) => {
      const newThreads = state.threads.filter((t) => t.id !== threadId);
      return {
        threads: newThreads,
        currentThread:
          state.currentThread?.id === threadId
            ? newThreads[0] || null
            : state.currentThread,
      };
    }),

  // Product Selection
  selectedProducts: [],
  toggleProductSelection: (productId) =>
    set((state) => {
      if (state.selectedProducts.includes(productId)) {
        return {
          selectedProducts: state.selectedProducts.filter(
            (id) => id !== productId
          ),
        };
      } else if (state.selectedProducts.length < 4) {
        return {
          selectedProducts: [...state.selectedProducts, productId],
        };
      }
      return state;
    }),
  clearSelection: () => set({ selectedProducts: [] }),
  isProductSelected: (productId) =>
    get().selectedProducts.includes(productId),

  // UI State
  sidebarOpen: true,
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  currentPage: "home",
  setCurrentPage: (page) => set({ currentPage: page }),
}));
