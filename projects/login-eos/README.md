# Login with popular EOS wallets

## Module dependencies
```
scatter-core
scatterjs-plugin-eosjs
eosjs@16.0.9
```
## Installation
```
npm i --save ulm-eosio
```

## Patch for scatter libs compatible with your angular app
```
// put the code below in patch.js in root of your project and (node patch.js)
const fs = require('fs');
const f = 'node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.js';

fs.readFile(f, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/node: false/g, 'node: {crypto: true, stream: true}');

  fs.writeFile(f, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});
```

## Usage
### app.module.ts
```
import { LoginEOSModule } from 'ulm-eosio';

...
// @NgModule config example
LoginEOSModule.forRoot({
          appName: 'your_app_name',
          httpEndpoint: 'https://bp.cryptolions.io,
          chain: 'aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
          verbose: false,
          blockchain: 'eos',
          host: 'bp.cryptolions.io',
          port: 443,
          protocol: 'https',
          expireInSeconds: 5
    }),
...

```
### app.component.html
```
<app-login-eos></app-login-eos>
```
### login.component.ts
```
import { Component, OnInit } from '@angular/core';
import { LoginEOSService } from 'ulm-eosio';

@Component({
  selector: 'login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
	constructor(public loginEOSService: LoginEOSService){}   
}

```
### login.component.html
```
// example of login/logout button 
 <a class="" (click)="loginEOSService.openPopup()" *ngIf="!loginEOSService.connected">Login</a>
 <a class="" (click)="loginEOSService.logout()" *ngIf="loginEOSService.connected">Logout</a>  
```

## Events
```
// you can subscribe for loggedin events 
this.loginEOSService.loggedIn.subscribe(res => {
        // do something
});
```

## Example of usage with contracts
```
this.loginEOSService.eos.contract('your contract name', {
    accounts: ['your network config']
}).then(contract => {
      contract['contract action name']('some data fields', this.loginEOSService.options)
              .then((result: any) => {
                   // do something
              }).catch(err => {
                   this.loginEOSService.contractError(err);
              });
}).catch(err => {
    this.loginEOSService.contractError(err);
});
```

## Show messages
```
this.loginEOSService.contractError(err);
this.loginEOSService.showMessage('your message text');
```




