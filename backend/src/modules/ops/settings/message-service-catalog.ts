import type { NotificationEvent } from "@/modules/notifications/policy/events.js";

export type WhatsAppMetaCategory = "authentication" | "utility" | "marketing";

export type MessageServiceCatalogEntry = {
    templateKey: string;
    events: NotificationEvent[];
    variables: string[];
    adminDescription: string;
    smsSuggestedText: string;
    whatsappSuggestedText: string;
    whatsappMetaCategory: WhatsAppMetaCategory;
    msg91FlowEnvKey: string;
    msg91TemplateEnvKey: string;
    enableSmsNote: string;
    enableWhatsappNote: string;
};

export const MESSAGE_SERVICE_CATALOG: MessageServiceCatalogEntry[] = [
    {
        templateKey: "login_otp",
        events: ["LOGIN_OTP"],
        variables: ["otp", "androidAppHash"],
        adminDescription: "OTP for customer or vendor phone login. Required for authentication when SMS or WhatsApp is enabled.",
        smsSuggestedText: "Your sajawat24 code is {#otp#}. Valid for 5 minutes.",
        whatsappSuggestedText: "Your sajawat24 verification code is {{1}}. Valid for 5 minutes.",
        whatsappMetaCategory: "authentication",
        msg91FlowEnvKey: "MSG91_FLOW_LOGIN_OTP",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_LOGIN_OTP",
        enableSmsNote: "Enable platform SMS after DLT template approval. Set MSG91_TEMPLATE_LOGIN_OTP or add SMS step to Flow.",
        enableWhatsappNote: "Enable platform WhatsApp after Meta approves Authentication template. Set MSG91_FLOW_LOGIN_OTP.",
    },
    {
        templateKey: "booking_confirmed",
        events: ["BOOKING_CONFIRMED"],
        variables: ["customerName", "orderRef", "scheduledAt", "trackUrl"],
        adminDescription: "Customer: booking confirmed after payment or checkout.",
        smsSuggestedText:
            "sajawat24: Hi {#customerName#}, booking {#orderRef#} confirmed for {#scheduledAt#}. Track: {#trackUrl#}",
        whatsappSuggestedText:
            "sajawat24: Hi {{1}}, booking {{2}} confirmed for {{3}}. Track: {{4}}",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_BOOKING_CONFIRMED",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_BOOKING_CONFIRMED",
        enableSmsNote: "DLT-approve SMS text, set template ID, then enable SMS channel.",
        enableWhatsappNote: "Meta Utility template + Flow ID in env.",
    },
    {
        templateKey: "booking_assigned",
        events: ["BOOKING_ASSIGNED"],
        variables: ["vendorName", "orderRef", "scheduledAt", "trackUrl"],
        adminDescription: "Customer: decorator assigned to their order.",
        smsSuggestedText:
            "sajawat24: Vendor {#vendorName#} assigned to {#orderRef#} on {#scheduledAt#}. Track: {#trackUrl#}",
        whatsappSuggestedText:
            "sajawat24: Vendor {{1}} assigned to {{2}} on {{3}}. Track: {{4}}",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_BOOKING_ASSIGNED",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_BOOKING_ASSIGNED",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "vendor_en_route",
        events: ["VENDOR_EN_ROUTE"],
        variables: ["vendorName", "orderRef", "trackUrl"],
        adminDescription: "Customer: partner is traveling to the venue.",
        smsSuggestedText: "sajawat24: {#vendorName#} is on the way for {#orderRef#}. Track: {#trackUrl#}",
        whatsappSuggestedText: "sajawat24: {{1}} is on the way for {{2}}. Track: {{3}}",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_VENDOR_EN_ROUTE",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_VENDOR_EN_ROUTE",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "vendor_on_site",
        events: ["VENDOR_ON_SITE"],
        variables: ["vendorName", "orderRef"],
        adminDescription: "Customer: partner arrived at the venue.",
        smsSuggestedText: "sajawat24: {#vendorName#} has arrived for {#orderRef#}. Setup will begin shortly.",
        whatsappSuggestedText: "sajawat24: {{1}} has arrived for {{2}}. Setup will begin shortly.",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_VENDOR_ON_SITE",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_VENDOR_ON_SITE",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "delivery_code",
        events: ["DELIVERY_CODE"],
        variables: ["orderRef", "code"],
        adminDescription: "Customer: completion code to share with the decorator.",
        smsSuggestedText:
            "sajawat24: Your completion code for {#orderRef#} is {#code#}. Share with your decorator when setup is done.",
        whatsappSuggestedText:
            "sajawat24: Your completion code for {{1}} is {{2}}. Share with your decorator when setup is done.",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_DELIVERY_CODE",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_DELIVERY_CODE",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "booking_completed",
        events: ["BOOKING_COMPLETED"],
        variables: ["orderRef"],
        adminDescription: "Customer: decoration job finished.",
        smsSuggestedText: "sajawat24: Booking {#orderRef#} is complete. Thank you!",
        whatsappSuggestedText: "sajawat24: Booking {{1}} is complete. Thank you!",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_BOOKING_COMPLETED",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_BOOKING_COMPLETED",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "booking_reminder",
        events: ["BOOKING_REMINDER"],
        variables: ["orderRef", "scheduledAt", "trackUrl"],
        adminDescription: "Customer: reminder before scheduled booking.",
        smsSuggestedText:
            "sajawat24: Reminder — booking {#orderRef#} is scheduled for {#scheduledAt#}. Track: {#trackUrl#}",
        whatsappSuggestedText:
            "sajawat24: Reminder — booking {{1}} is scheduled for {{2}}. Track: {{3}}",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_BOOKING_REMINDER",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_BOOKING_REMINDER",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "vendor_new_job",
        events: ["VENDOR_NEW_JOB"],
        variables: ["orderRef", "scheduledAt", "address"],
        adminDescription: "Vendor: new marketplace job (also push and in-app).",
        smsSuggestedText: "sajawat24: New job {#orderRef#} on {#scheduledAt#} at {#address#}. Open vendor app.",
        whatsappSuggestedText: "sajawat24: New job {{1}} on {{2}} at {{3}}. Open vendor app.",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_VENDOR_NEW_JOB",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_VENDOR_NEW_JOB",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "vendor_job_assigned",
        events: ["VENDOR_JOB_ASSIGNED"],
        variables: ["orderRef", "scheduledAt", "address"],
        adminDescription: "Vendor worker: assigned to a job.",
        smsSuggestedText:
            "sajawat24: You were assigned job {#orderRef#} on {#scheduledAt#} at {#address#}. Open partner app.",
        whatsappSuggestedText:
            "sajawat24: You were assigned job {{1}} on {{2}} at {{3}}. Open partner app.",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_VENDOR_JOB_ASSIGNED",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_VENDOR_JOB_ASSIGNED",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "payout_paid",
        events: ["PAYOUT_PAID"],
        variables: ["amountFormatted", "payoutDestination"],
        adminDescription: "Vendor: withdrawal sent successfully.",
        smsSuggestedText:
            "sajawat24: Your payout of {#amountFormatted#} was sent to {#payoutDestination#}. Open the vendor app for details.",
        whatsappSuggestedText:
            "sajawat24: Your payout of {{1}} was sent to {{2}}. Open the vendor app for details.",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_PAYOUT_PAID",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_PAYOUT_PAID",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
    {
        templateKey: "payout_failed",
        events: ["PAYOUT_FAILED"],
        variables: ["amountFormatted", "failureReason"],
        adminDescription: "Vendor: withdrawal failed; amount returned to wallet.",
        smsSuggestedText:
            "sajawat24: Payout of {#amountFormatted#} failed. {#failureReason#} Amount returned to your wallet.",
        whatsappSuggestedText:
            "sajawat24: Payout of {{1}} failed. {{2}} Amount returned to your wallet.",
        whatsappMetaCategory: "utility",
        msg91FlowEnvKey: "MSG91_FLOW_PAYOUT_FAILED",
        msg91TemplateEnvKey: "MSG91_TEMPLATE_PAYOUT_FAILED",
        enableSmsNote: "DLT SMS after approval.",
        enableWhatsappNote: "Meta Utility + Flow.",
    },
];

export function getMessageServiceCatalog(): MessageServiceCatalogEntry[] {
    return MESSAGE_SERVICE_CATALOG;
}
