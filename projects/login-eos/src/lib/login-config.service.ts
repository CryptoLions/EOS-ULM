import { InjectionToken } from '@angular/core';

export interface configInterface {
	appName: string;
    httpEndpoint: string;
    chain: string;
    verbose: boolean;
    blockchain: string;
    host: string;
    port: number;
    protocol: string;
    expireInSeconds: number;
}

export const configNetworkService = new InjectionToken<configInterface>('configInterface');