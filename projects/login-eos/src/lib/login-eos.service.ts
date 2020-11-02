import { Injectable, EventEmitter, Inject } from '@angular/core';
import { ToastaService, ToastaConfig, ToastOptions, ToastData } from 'ngx-toasta';
import { configInterface, configNetworkService } from './login-config.service';

// import ScatterLynx from 'scatterjs-plugin-lynx';
import { Link, LinkSession } from 'anchor-link';
import BrowserTransport from 'anchor-link-browser-transport'
import { JsonRpc, Api } from 'eosjs';
import ScatterJS from '@scatterjs/core';
import ScatterEOS from '@scatterjs/eosjs2';
// import AnchorLinkBrowserTransport from 'anchor-link-browser-transport'

import * as waxjs from "@waxio/waxjs/dist";

import { Ledger, LedgerUser } from 'ual-ledger';
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

  exampleNet = {
    chainId: this.config.chain,
    rpcEndpoints: [{
      protocol: this.config.protocol,
      host: this.config.host,
      port: this.config.port,
    }]
  }

  anchorLink: any;
  anchorLinkSession: any = LocalSessionStorage;
  rpc: any = new JsonRpc(this.network.fullhost());


  eos: any;

  ScatterJS: any = ScatterJS;
  loggedIn: any = new EventEmitter<boolean>();
  accountName: any;
  options: any;
  initCounterErr = 0;
  eosTock: any;
  inProgress = false;
  accountInfo = { publicKey: '' };
  ledgerAccName = '';
  ledger: any;;
  user: any;;

  constructor(private toastyService: ToastaService,
    private toastyConfig: ToastaConfig,
    @Inject(configNetworkService) public config) {
    this.toastyConfig.position = 'top-center';
    this.toastyConfig.theme = 'material';
    ScatterJS.plugins(new ScatterEOS());
  }

  async ledgerConfirm() {
    let accNameIsValid = this.ledgerAccName.match(/^[a-z0-5]+$/) != null;
    if (accNameIsValid && this.ledgerAccName.length > 0 && this.ledgerAccName.length <= 12) {
      try {
        await this.initLedger();
        this.closePopUpLedger();
        this.closePopUp();
      } catch (error) {
        this.showScatterError(error);
      }
    } else {
      this.showScatterError("Invalid account name");
    }
  }

  async initLedger(selfInvoked = false) {
    let accName;
    const rpc = new JsonRpc(this.network.fullhost());
    this.rpc = rpc;
    this.eos = ScatterJS.eos(this.network, Api, { rpc: this.rpc });
    if (selfInvoked) {
      accName = localStorage.getItem("accName");
      this.accountName = localStorage.getItem("accName");
      let ledger = new Ledger([this.exampleNet], { appName: this.config.appName });
      await ledger.init();
      this.user = new LedgerUser(this.exampleNet, accName, false);
      await this.user.init();
      try {
        await this.user.isAccountValid();
      } catch (error) {
        this.showScatterError(error);
        this.logout();
      }
    } else {
      this.ledger = new Ledger([this.exampleNet], { appName: this.config.appName });
      accName = this.ledgerAccName;
      await this.ledger.init();
      this.user = new LedgerUser(this.exampleNet, accName, this.ledger.requiresGetKeyConfirmation(accName));

      await this.user.init();

      await this.ledger.login(accName);
      localStorage.setItem('accName', accName);
      localStorage.setItem('walletConnected', 'connected');
      this.eosioWalletType = 'ledger';
      localStorage.setItem('eosioWalletType', this.eosioWalletType);
      this.accountName = accName;
      this.loggedIn.emit(true);
      this.connected = true;
      this.user = this.ledger.users[0];
    }

    this.eos['transaction'] = ({ actions }, broadcast: true, sign: false) => {
      return this.user.signTransaction({ actions }, {
        blocksBehind: 3,
        expireSeconds: 30,
        broadcast,
      })
    };



  }

  async initAnchorLink() {
    const rpc = new JsonRpc(this.network.fullhost());
    this.rpc = rpc;
    this.eos = ScatterJS.eos(this.network, Api, { rpc: this.rpc });
    // const anchorRPC: any = ScatterJS.eos(this.network, Api, { rpc: this.rpc });
    // establish anchor-link instance
    this.anchorLink = new Link({
      chainId: this.config.chain,
      rpc: `${this.network.protocol}://${this.network.host}:${this.network.port}`,
      transport: new BrowserTransport()
    })
    // establish persistence
    this.anchorLinkSession = new LocalSessionStorage();
    // attempt to restore any prior sessions
    let session = this.anchorLinkSession.restore(
      this.anchorLink,
      this.config.chain
    );
    this.eosioWalletType = 'anchorLink';
    if (session) {
      // if prior session found, establish various components to use it
      this.accountName = session.auth.actor;
      this.accountInfo["publicKey"] = session.publicKey;
      this.options = { authorization: [`${session.auth.actor}@${session.auth.permission}`] };
      localStorage.setItem('walletConnected', 'connected');
      localStorage.setItem('eosioWalletType', this.eosioWalletType);
      this.loggedIn.emit(true);
      this.connected = true;
      this.closePopUp();
    }
    else {
      // otherwise establish new session
      let identity = await this.anchorLink.login("ulm-eosio");
      this.accountInfo["publicKey"] = identity.signerKey;
      this.accountName = identity.signer.actor;
      this.options = { authorization: [`${identity.signer.actor}@${identity.signer.permission}`] };
      // set appropriate localstorage values for uml
      localStorage.setItem('walletConnected', 'connected');
      localStorage.setItem('eosioWalletType', this.eosioWalletType);
      // save this session for future use
      this.anchorLinkSession.store(identity.session, this.config.chain);
      this.loggedIn.emit(true);
      this.connected = true;
      // set tge current session to that of the identity
      session = identity.session;
      this.closePopUp();
      this.showMessage(`Hi ${this.accountName} :)`);
    }
    this.eos['transaction'] = ({ actions }, broadcast: true, sign: false) => {
      return this.anchorLink.transact({
        actions
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
        broadcast,
        sign
      });
    };

  }

  initScatter(selfInvoked = false) {
    const rpc = new JsonRpc(this.network.fullhost());
    this.rpc = rpc;
    this.eos = ScatterJS.eos(this.network, Api, { rpc: this.rpc });
    this.inProgress = true;
    this.ScatterJS.connect(this.config.appName, { network: this.network }).then(connected => {
      if (!connected && !selfInvoked) {
        if (this.initCounterErr < 2) {
          this.initCounterErr += 1;
          return this.initScatter();
        }
        this.inProgress = false;
        return this.showScatterError('Can\'t connect to Scatter');
      }
      this.eos = this.ScatterJS.eos(this.network, Api, { rpc: this.rpc });

      this.ScatterJS.login().then(id => {
        this.inProgress = false;
        if (!id) {
          return this.showScatterError('no identity');
        };

        let account = ScatterJS.account('eos');
        this.accountName = account.name;
        this.accountInfo["publicKey"] = account.publicKey;
        this.options = { authorization: [`${account.name}@${account.authority}`] };

        localStorage.setItem('walletConnected', 'connected');
        this.eosioWalletType = 'scatter';
        localStorage.setItem('eosioWalletType', this.eosioWalletType);

        this.loggedIn.emit(true);
        this.connected = true;
        this.closePopUp();
        this.showMessage(`Hi ${this.accountName} :)`);
        this.eos['transaction'] = ({ actions }, broadcast: true, sign: false) => {
          return this.eos.transact({
            actions
          }, {
            blocksBehind: 3,
            expireSeconds: 30,
            broadcast,
            sign
          });
        };

      }).catch(error => {
        this.inProgress = false;
        this.showScatterError(error);
      });
    }).catch(error => {
      if (localStorage.getItem('walletConnected') === 'connected') {
        localStorage.setItem('walletConnected', 'disconnect');
        location.reload();
      } else {
        this.inProgress = false;
        this.showScatterError(error);
      }
    });
  }

  // initEostock() {
  //   if (!this.WINDOW.eosTock) {
  //     return this.showScatterError('Can\'t connect to EOStock');
  //   }
  //   this.WINDOW.eosTock.login([this.eosConf]).then(identity => {
  //     if (!identity) {
  //       return this.showScatterError('no identity');
  //     };
  //     this.eosTock = this.WINDOW.eosTock;
  //     this.WINDOW.eosTock = null;

  //     this.eos = this.eosTock.eos(this.eosConf, Api);

  //     this.accountName = identity.account;
  //     this.accountInfo = identity;
  //     this.options = { authorization: [`${this.accountName}@active`] };

  //     localStorage.setItem('walletConnected', 'connected');
  //     this.eosioWalletType = 'eostock';
  //     localStorage.setItem('eosioWalletType', this.eosioWalletType);

  //     this.loggedIn.emit(true);
  //     this.connected = true;
  //     this.closePopUp();
  //     this.showMessage(`Hi ${this.accountName} :)`);
  //   }).catch(error => {
  //     this.showScatterError(error);
  //   });
  // }

  async initWAX() {
    const wax: any = new waxjs.WaxJS(this.config.httpEndpoint);
    const rpc = new JsonRpc(this.network.fullhost());
    this.rpc = rpc;
    this.eos = ScatterJS.eos(this.network, Api, { rpc: this.rpc });
    // const waxRPC: any = ScatterJS.eos(this.network, Api, { rpc: this.rpc });

    try {
      let isAutoLoginAvailable
      try {
        isAutoLoginAvailable = await wax.isAutoLoginAvailable();
      }
      catch (error) {
        console.log("error", error);
      }
      if (isAutoLoginAvailable) {
        this.accountName = wax.userAccount;
        this.accountInfo["publicKey"] = wax.pubKeys[0];
      } else {
        this.accountName = await wax.login();
        this.accountInfo["publicKey"] = wax.pubKeys[0];
      }

    } catch (error) {
      this.showScatterError(error);
    }

    if (!this.accountName) {
      throw new Error('can’t get account name from wax cloud wallet');
    }

    this.eos['transaction'] = ({ actions }, broadcast: true, sign: false) => {
      return wax.api.transact({
        actions
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
        broadcast,
        sign
      });
    };
    this.options = { authorization: [`${this.accountName}@active`] };

    localStorage.setItem('walletConnected', 'connected');
    this.eosioWalletType = 'wax';
    localStorage.setItem('eosioWalletType', this.eosioWalletType);

    this.loggedIn.emit(true);
    this.connected = true;
    this.closePopUp();
    this.showMessage(`Hi ${this.accountName} :)`);
  }

  openPopup() {
    let popup = document.getElementById('popup-window');
    popup.setAttribute("class", "popup-window-visible");
    popup.addEventListener("click", (event: any) => {
      if (event.srcElement.className === 'popup-window-visible') {
        this.closePopUp();
        this.closePopUpLedger();
      }
    });
  };

  closePopUp() {
    let popup = document.getElementById('popup-window');
    popup.removeAttribute("class");
  }

  openPopupLedger() {
    let popup = document.getElementById('popup-ledger');
    popup.setAttribute("class", "popup-ledger-visible");
    popup.addEventListener("click", (event: any) => {
      if (event.srcElement.className === 'popup-ledger-visible') {
        this.closePopUpLedger();
      }
    });
  };

  closePopUpLedger() {
    let popup = document.getElementById('popup-ledger');
    popup.removeAttribute("class");
  }

  showScatterError(error) {
    let toastOption: ToastOptions = {
      title: 'Error',
      msg: '',
      showClose: true,
      timeout: 3000,
      theme: 'material'
    };
    if (!error) { return; }
    if (!error.message) {
      toastOption.msg = error
      return this.toastyService.error(toastOption);
    }
    let msg = error.message;
    console.log('Scatter error type - ', error);
    if ((error.type === 'identity_rejected' || error.type === 'locked') && !this.connected) {
      location.reload();
    }
    toastOption.msg = msg || error
    this.toastyService.error(toastOption);
  }

  contractError(err) {
    if (!err) {
      return;
    }
    if (!err.message) {
      try {
        err = JSON.parse(err).error.details[0].message;
      } catch (e) {
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
      timeout: 2000,
      theme: 'material'
    };
    this.toastyService.success(toastOption);
  }

  logout() {
    if (this.eosioWalletType === 'scatter') {
      this.ScatterJS.forgetIdentity().then(() => {
        localStorage.setItem('walletConnected', 'disconnect');
        location.reload();
      }).catch(err => {
        this.showScatterError(err);
      });
    } else if (this.eosioWalletType === 'eostock') {
      this.eosTock.logout().then(() => {
        localStorage.setItem('walletConnected', 'disconnect');
        location.reload();
      }).catch(err => {
        this.showScatterError(err);
      });
    } else if (this.eosioWalletType === 'wax') {
      localStorage.setItem('walletConnected', 'disconnect');
      location.reload();
    } else if (this.eosioWalletType === 'anchorLink') {
      localStorage.setItem('walletConnected', 'disconnect');
      localStorage.clear();
      location.reload();
    } else if (this.eosioWalletType === 'ledger') {
      localStorage.clear();
      location.reload();
    }
  }

  // ==== service end
}


interface SessionStorage {
  store(session: LinkSession, id: string, accountName?: string): Promise<void>;
  restore(
    link: Link,
    id: string,
    accountName?: string
  ): LinkSession | null;
  remove(id: string, accountName?: string): Promise<void>;
}

class LocalSessionStorage implements SessionStorage {
  constructor(readonly keyPrefix: string = 'anchorlink') { }

  private sessionKey(id: string, accountName?: string) {
    return [this.keyPrefix, id, accountName]
      .filter(v => typeof v === 'string' && v.length > 0)
      .join('-');
  }

  async store(session: LinkSession, id: string, accountName?: string) {
    const key = this.sessionKey(id, accountName);
    const data = session.serialize();
    localStorage.setItem(key, JSON.stringify(data));
  }

  restore(link: Link, id: string, accountName?: string) {
    const key = this.sessionKey(id, accountName);
    const data = JSON.parse(localStorage.getItem(key) || 'null');
    if (data) {
      return LinkSession.restore(link, data);
    }
    return null;
  }

  async remove(id: string, accountName?: string) {
    localStorage.removeItem(this.sessionKey(id, accountName));
  }
}