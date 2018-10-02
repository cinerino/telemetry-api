/**
 * アプリケーション固有の型
 */
import * as cinerino from '@cinerino/telemetry-domain';
import * as express from 'express';
declare global {
    namespace Express {
        /**
         * APIユーザー(Cognitから認可を受ける)
         */
        export type IUser = cinerino.factory.clientUser.IClientUser;
        // tslint:disable-next-line:interface-name
        export interface Request {
            agent: cinerino.factory.person.IPerson;
            user: IUser;
            accessToken: string;
        }
    }
}
