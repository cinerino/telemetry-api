"use strict";
/**
 * OAuthミドルウェア
 * @see https://aws.amazon.com/blogs/mobile/integrating-amazon-cognito-user-pools-with-api-gateway/
 */
// import * as cinerino from '@cinerino/telemetry-domain';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// 許可発行者リスト
// const ISSUERS = (<string>process.env.TOKEN_ISSUERS).split(',');
// tslint:disable-next-line:no-single-line-block-comment
/* istanbul ignore next */
exports.default = (_, __, next) => __awaiter(void 0, void 0, void 0, function* () {
    next();
    // try {
    //     await cognitoAuth({
    //         issuers: ISSUERS,
    //         authorizedHandler: async (user, token) => {
    //             req.user = user;
    //             req.accessToken = token;
    //             req.agent = {
    //                 typeOf: cinerino.factory.personType.Person,
    //                 id: user.sub,
    //                 memberOf: (user.username !== undefined) ? {
    //                     typeOf: <cinerino.factory.programMembership.ProgramMembershipType>'ProgramMembership',
    //                     membershipNumber: user.username,
    //                     programName: 'Amazon Cognito',
    //                     award: [],
    //                     url: user.iss
    //                 } : undefined
    //             };
    //             next();
    //         },
    //         unauthorizedHandler: (err) => {
    //             next(new cinerino.factory.errors.Unauthorized(err.message));
    //         }
    //     })(req, res, next);
    // } catch (error) {
    //     next(new cinerino.factory.errors.Unauthorized(error.message));
    // }
});
