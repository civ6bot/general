// noinspection HttpUrlsUsage
export abstract class RequestsBase {
    protected readonly dbURL = `http://${process.env.DATABASE_HOSTNAME}:${process.env.DATABASE_PORT}`;
    abstract readonly requestPath: string;
}
