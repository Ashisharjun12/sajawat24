export type SmsJobPayload = {
    to: string;
    template: string;
    data: Record<string, string>;
};

export type SmsMessage = {
    to: string;
    body: string;
    meta?: {
        event?: string;
        eventData?: Record<string, string>;
    };
};

export interface ISmsProvider {
    send(message: SmsMessage): Promise<void>;
}
