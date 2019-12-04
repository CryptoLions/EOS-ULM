import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { LoginEOSModule } from '../../projects/login-eos/src/lib/login-eos.module'; 
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    LoginEOSModule.forRoot({
    	appName: 'test WAX',
    	httpEndpoint: 'https://wax.greymass.com',
    	chain: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
    	verbose: false,
    	blockchain: 'eos',
    	host: 'wax.greymass.com',
    	port: 443,
    	protocol: 'https',
    	expireInSeconds: 30
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
