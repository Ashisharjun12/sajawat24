export type EmailMessage = {
    to: string;
    subject: string;
    html: string;
    text?: string;
};

export interface IEmailProvider {
    send(message: EmailMessage): Promise<void>;
}
