export interface PresenceStore {
    setOnline(userId: string, online: boolean): void;
    isOnline(userId: string): boolean;
}

class InMemoryPresenceStore implements PresenceStore {
    private readonly online = new Set<string>();

    setOnline(userId: string, online: boolean): void {
        if (online) this.online.add(userId);
        else this.online.delete(userId);
    }

    isOnline(userId: string): boolean {
        return this.online.has(userId);
    }
}

export const presenceStore: PresenceStore = new InMemoryPresenceStore();
