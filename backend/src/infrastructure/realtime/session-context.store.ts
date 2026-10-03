export type AppState = "foreground" | "background";

export type UserSessionContext = {
    connected: boolean;
    appState: AppState;
    activeConversationId: string | null;
    updatedAt: number;
};

export type SessionContextPatch = Partial<
    Pick<UserSessionContext, "connected" | "appState" | "activeConversationId">
>;

export interface SessionContextStore {
    setContext(userId: string, patch: SessionContextPatch): void;
    getContext(userId: string): UserSessionContext;
    clearOnDisconnect(userId: string): void;
    onConnect(userId: string): void;
    onDisconnect(userId: string): void;
}

const DEFAULT_CONTEXT: UserSessionContext = {
    connected: false,
    appState: "background",
    activeConversationId: null,
    updatedAt: 0,
};

class InMemorySessionContextStore implements SessionContextStore {
    private readonly contexts = new Map<string, UserSessionContext>();
    private readonly connectionCounts = new Map<string, number>();

    onConnect(userId: string): void {
        const count = (this.connectionCounts.get(userId) ?? 0) + 1;
        this.connectionCounts.set(userId, count);
        this.setContext(userId, { connected: true, appState: "foreground" });
    }

    onDisconnect(userId: string): void {
        const count = Math.max(0, (this.connectionCounts.get(userId) ?? 1) - 1);
        if (count === 0) {
            this.connectionCounts.delete(userId);
            this.clearOnDisconnect(userId);
            return;
        }
        this.connectionCounts.set(userId, count);
    }

    setContext(userId: string, patch: SessionContextPatch): void {
        const current = this.contexts.get(userId) ?? { ...DEFAULT_CONTEXT };
        this.contexts.set(userId, {
            connected: patch.connected ?? current.connected,
            appState: patch.appState ?? current.appState,
            activeConversationId:
                patch.activeConversationId !== undefined
                    ? patch.activeConversationId
                    : current.activeConversationId,
            updatedAt: Date.now(),
        });
    }

    getContext(userId: string): UserSessionContext {
        return this.contexts.get(userId) ?? { ...DEFAULT_CONTEXT };
    }

    clearOnDisconnect(userId: string): void {
        this.contexts.delete(userId);
    }
}

export const sessionContextStore: SessionContextStore = new InMemorySessionContextStore();
