import { FeishuController, FeishuStrategy } from './feishu';
import { Auth0Strategy, Auth0Controller } from './auth0';
import { FacebookStrategy, FacebookController } from './facebook';
// import { FiverrStrategy } from './fiverr';
import { GithubStrategy, GithubController } from './github';
import { GoogleStrategy, GoogleController } from './google';
// import { KeycloakStrategy, KeycloakAuthGuard } from './keycloak';
import { LinkedinStrategy, LinkedinController } from './linkedin';
// import {
// 	MicrosoftStrategy,
// 	MicrosoftController,
// 	MicrosoftAuthGuard
// } from './microsoft';
import { TwitterStrategy, TwitterController } from './twitter';
import { DingtalkController, DingtalkStrategy } from './dingtalk';

export const Strategies = [
	Auth0Strategy,
	FacebookStrategy,
	// FiverrStrategy,
	GithubStrategy,
	GoogleStrategy,
	// KeycloakStrategy,
	LinkedinStrategy,
	// MicrosoftStrategy,
	TwitterStrategy,
	FeishuStrategy,
	DingtalkStrategy
];

export const Controllers = [
	Auth0Controller,
	FacebookController,
	GithubController,
	GoogleController,
	LinkedinController,
	TwitterController,
	// MicrosoftController,
	FeishuController,
	DingtalkController
];

export const AuthGuards = [];
