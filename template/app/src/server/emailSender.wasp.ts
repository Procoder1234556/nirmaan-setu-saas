import { type EmailSender } from "@wasp.sh/spec";

export const emailSender: EmailSender = {
  provider: "SMTP",
  defaultFrom: {
    name: "Nirmaan Setu",
    email: "notifications@nirmaansetu.com",
  },
};
