declare global {
    namespace NodeJS {
        interface ProcessEnv {
            token: string;
            db_h: string;
            db_u: string;
            db: string;
            db_p: string;
        }
    }
}

export {}