import pino from "pino";
import { transform } from "typescript";

export const logger = pino({
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standart",
      ingone: "pid,hostname",
    },
  },
});
