import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { LoginEOSModule } from '../../projects/login-eos/src/lib/login-eos.module'; 

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    LoginEOSModule.forRoot({
    	appName: 'test',
    	httpEndpoint: 'https://bp.cryptolions.io',
    	chain: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
    	verbose: false,
    	blockchain: 'eos',
    	host: 'bp.cryptolions.io',
    	port: 443,
    	protocol: 'https',
    	expireInSeconds: 30
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
