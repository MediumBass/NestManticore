import type { Config } from "drizzle-kit";
import {InternalServerErrorException} from "@nestjs/common";

const user: string | undefined = process.env.POSTGRES_USER;
const pass: string | undefined = process.env.POSTGRES_PASSWORD
const db: string | undefined = process.env.POSTGRES_DB;
const port: string | undefined = process.env.POSTGRES_PORT;
const host: string = process.env.POSTGRES_HOST || 'localhost'
if (!user || !pass || !db || !port || !host)
    throw new InternalServerErrorException(
        'Missing required environment variables: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT, POSTGRES_HOST',
    );

const connectionString = `postgresql://${user}:${pass}@${host}:${port}/${db}`;

export default {
    schema: "./src/database/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: connectionString,
    },
} satisfies Config;