export const storage = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error)
      return null
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error)
    }
  },

  async delete(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error deleting ${key} from storage:`, error)
    }
  },

  async keys(): Promise<string[]> {
    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.error('Error getting keys from storage:', error)
      return []
    }
  }
}
