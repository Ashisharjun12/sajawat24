export type WhatsAppMessage = {
    to: string;
    template: string;
    data: Record<string, string>;
    meta?: {
        event?: string;
        eventData?: Record<string, string>;
    };
};

export interface WhatsAppPort {
    send(message: WhatsAppMessage): Promise<void>;
}
