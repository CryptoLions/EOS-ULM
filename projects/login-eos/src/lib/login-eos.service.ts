import { Injectable, EventEmitter, Inject } from '@angular/core';
import { ToastaService, ToastaConfig, ToastOptions, ToastData } from 'ngx-toasta';
import { configInterface, configNetworkService } from './login-config.service';

import ScatterJS from 'scatterjs-core';
import ScatterEOS from 'scatterjs-plugin-eosjs';
import ScatterLynx from 'scatterjs-plugin-lynx';
import Eos from 'eosjs';

import * as waxjs from "@waxio/waxjs/dist";

//import { SignatureProvider } from 'eosjs-ledger-signature-provider';

@Injectable({
  providedIn: 'root'
})
export class LoginEOSService {
  
  WINDOW: any = window;
  connected = (localStorage.getItem('walletConnected') === 'connected') ? true : false;
  eosioWalletType = localStorage.getItem('eosioWalletType') || 'scatter'; 
  eosConf = {
        httpEndpoint: this.config.httpEndpoint,
        chainId: this.config.chain,
        verbose: this.config.verbose
  };
  //signatureProvider = new SignatureProvider();
  network = ScatterJS.Network.fromJson({
        blockchain: this.config.blockchain,
        host: this.config.host,
        port: this.config.port,
        protocol: this.config.protocol,
        expireInSeconds: this.config,
        chainId: this.config.chain
  });
  eos: any          = Eos(this.eosConf);
  waxRPC: any       = Eos(this.eosConf);
  ScatterJS: any = ScatterJS;
  loggedIn: any  = new EventEmitter<boolean>();
  accountName: any;
  options: any;
  initCounterErr = 0;
  eosTock: any;
  inProgress = false;

  constructor(private toastyService: ToastaService,
              private toastyConfig: ToastaConfig,
              @Inject(configNetworkService) public config) {
     this.toastyConfig.position = 'top-center';
     this.toastyConfig.theme = 'material';
     this.ScatterJS.plugins( new ScatterEOS(), new ScatterLynx(Eos) );
  }

  initScatter() {
    this.inProgress = true;
    this.ScatterJS.connect(this.config.appName, { network: this.network }).then(connected => {
      if (!connected) {
          if (this.initCounterErr < 2){
              this.initCounterErr += 1;
              return this.initScatter();
          }
          this.inProgress = false;
          return this.showScatterError('Can\'t connect to Scatter');
      }
      this.eos = this.ScatterJS.eos(this.network, Eos);

      this.ScatterJS.login().then(id => {
              this.inProgress = false;
              if(!id) {
                return this.showScatterError('no identity');
              };

              let account = ScatterJS.account('eos'); 
              this.accountName = account.name;
              this.options = {authorization:[`${account.name}@${account.authority}`]};

              localStorage.setItem('walletConnected', 'connected');
              this.eosioWalletType = 'scatter';
              localStorage.setItem('eosioWalletType', this.eosioWalletType);
      
              this.loggedIn.emit(true);
              this.connected = true;
              this.closePopUp();
              this.showMessage(`Hi ${this.accountName} :)`);
      }).catch(error => {
        this.inProgress = false;
        this.showScatterError(error);
      });
    }).catch(error => {
        this.inProgress = false;
        this.showScatterError(error);
    });
  }

  initEostock() {
      if (!this.WINDOW.eosTock) {
          return this.showScatterError('Can\'t connect to EOStock');
      }
      this.WINDOW.eosTock.login([this.eosConf]).then(identity => {
            if(!identity) {
                return this.showScatterError('no identity');
            };
            this.eosTock = this.WINDOW.eosTock;
            this.WINDOW.eosTock = null; 

            this.eos = this.eosTock.eos(this.eosConf, Eos);
            
            this.accountName = identity.account;
            this.options = {authorization:[`${this.accountName}@active`]};

            localStorage.setItem('walletConnected', 'connected');
            this.eosioWalletType = 'eostock';
            localStorage.setItem('eosioWalletType', this.eosioWalletType);
      
            this.loggedIn.emit(true);
            this.connected = true;
            this.closePopUp();
            this.showMessage(`Hi ${this.accountName} :)`);
      }).catch(error => {
          this.showScatterError(error);
      });
  }

  async initWAX(){
      const wax :any     = new waxjs.WaxJS(this.config.httpEndpoint);

      try {
        this.accountName = await wax.login();
      } catch(error) {
        this.showScatterError(error);
      }

      this.eos['contract'] = (contractName, nets) => {
        return new Promise((resolve, reject) => {
            this.waxRPC.getAbi(contractName)
                .then((res: any) => {
                  let structs = {};
                  res.abi.structs.forEach(elem => {
                      structs[elem.name] = elem.fields;
                  });
                  
                  this.waxRPC.contract(contractName, nets)
                      .then(contract => {
                        let contractMethods = {};
                        Object.keys(contract).map((key) => {
                             contractMethods[key] = (...args: any[]) => {
                                 let data = {};
                                 structs[key].forEach((elem, index) => {
                                     data[elem.name] = args[index];
                                 });
                                 return wax.api.transact({
                                   actions: [{
                                     account: contractName,
                                     name: key,
                                     authorization: [{
                                       actor: this.accountName,
                                       permission: 'active',
                                     }],
                                     data,
                                   }]
                                 }, {
                                   blocksBehind: 3,
                                   expireSeconds: 30
                                 });
                             }  
                        });
                        resolve(contractMethods);
                      }).catch(err => reject(err));

                }).catch(err => reject(err));
        });
      };
      this.eos['transfer'] = (from, to, quantity, memo) => {
          return wax.api.transact({
            actions: [{
              account: 'eosio.token',
              name: 'transfer',
              authorization: [{
                actor: this.accountName,
                permission: 'active',
              }],
              data : {
                from,
                to,
                quantity,
                memo
              }
            }]
          }, {
            blocksBehind: 3,
            expireSeconds: 30
          });
      };

      this.options = {authorization:[`${this.accountName}@active`]};

      localStorage.setItem('walletConnected', 'connected');
      this.eosioWalletType = 'wax';
      localStorage.setItem('eosioWalletType', this.eosioWalletType);
      
      this.loggedIn.emit(true);
      this.connected = true;
      this.closePopUp();
      this.showMessage(`Hi ${this.accountName} :)`);
  }



  /*initLedger() {
       this.signatureProvider.getAvailableKeys()
          .then((result) => {
                console.log(result);
          }).catch((error) => {
                console.info('Error: ', error);
          });
  }*/

  openPopup(){
      let popup = document.getElementById('popup-window');
      popup.setAttribute("class", "popup-window-visible");
      popup.addEventListener("click", (event: any) => {
        if (event.srcElement.className === 'popup-window-visible'){
             this.closePopUp();
        }
      });
  };

  closePopUp(){
      let popup = document.getElementById('popup-window');
      popup.removeAttribute("class");
  }

  showScatterError(error) {
    if (!error) { return; }
    let msg = error.message;
    console.log('Scatter error type - ', error.type);
    if ( (error.type === 'identity_rejected' || error.type === 'locked') && !this.connected ){
          location.reload();
    }
    const toastOption: ToastOptions = {
         title: 'Error',
         msg: msg || error,
         showClose: true,
         timeout: 3000,
         theme: 'material'
    };
    this.toastyService.error(toastOption);
  }

  contractError(err) {
      if (!err) {
         return;
      }
      if (!err.message){
        try{
            err = JSON.parse(err).error.details[0].message;
        } catch(e){
            console.log(e);
        }
      } else {
        err = err.message;
      }
      if (err.indexOf('requires a config.keyProvider') >= 0) err = 'Please, login Scatter first!';

      const toastOption: ToastOptions = {
         title: 'Error',
         msg: err,
         showClose: true,
         timeout: 5000,
         theme: 'material'
      };
      this.toastyService.error(toastOption);
  }

  showErr(err) {
      let error;
      try {
         error = JSON.parse(err);
      } catch (e) {
         console.error(e);
         error = err;
      }
      if (!error || !error.error || !error.error.details || !error.error.details[0]) {
         return;
      }
      const toastOption: ToastOptions = {
         title: 'Error',
         msg: error.error.details[0].message,
         showClose: true,
         timeout: 3000,
         theme: 'material'
      };
      this.toastyService.error(toastOption);
  }

  showMessage(msg) {
      const toastOption: ToastOptions = {
         title: '',
         msg: msg,
         showClose: true,
         timeout: 1500,
         theme: 'material'
      };
      this.toastyService.success(toastOption);
  }

  logout() {
    if (this.eosioWalletType === 'scatter'){
        this.ScatterJS.forgetIdentity().then(() => {
            localStorage.setItem('walletConnected', 'disconnect');
            location.reload();
        }).catch(err => {
            this.showScatterError(err);
        });
    } else if (this.eosioWalletType === 'eostock'){
       this.eosTock.logout().then(() => {
          localStorage.setItem('walletConnected', 'disconnect');
          location.reload();
       }).catch(err => {
          this.showScatterError(err);
       });
    }  else if (this.eosioWalletType === 'wax'){
          localStorage.setItem('walletConnected', 'disconnect');
          location.reload();
    }
  }

// ==== service end
}





