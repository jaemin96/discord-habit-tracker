// Environment variable validation
// Install joi for runtime validation: pnpm add joi
// Then uncomment the code below and use validate option in ConfigModule

// import * as Joi from 'joi';
//
// export const validationSchema = Joi.object({
//   NODE_ENV: Joi.string()
//     .valid('development', 'production', 'test')
//     .default('development'),
//   PORT: Joi.number().default(3000),
//   DISCORD_BOT_TOKEN: Joi.string().required(),
//   DISCORD_CLIENT_ID: Joi.string().required(),
//   DISCORD_GUILD_ID: Joi.string().required(),
//   LOG_LEVEL: Joi.string()
//     .valid('error', 'warn', 'info', 'debug', 'verbose')
//     .default('info'),
// });

export const validationSchema = null; // Placeholder for now
