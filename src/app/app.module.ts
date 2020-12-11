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
      httpEndpoint: 'https://proton.greymass.com',
      chain: '384da888112027f0321850a169f737c33e53b388aad48b5adace4bab97f437e0',
      verbose: false,
      blockchain: 'eos',
      host: 'proton.greymass.com',
      port: 443,
      protocol: 'https',
      expireInSeconds: 30
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
