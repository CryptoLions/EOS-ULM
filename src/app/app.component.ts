import { Component, OnInit } from '@angular/core';
import { LoginEOSService } from '../../projects/login-eos/src/lib/login-eos.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
	constructor(public loginEOSService: LoginEOSService){};

	ngOnInit(){
		this.loginEOSService.loggedIn.subscribe(() => {
			/*this.loginEOSService.eos.getTableRows({  code: "simpleassets",
                              json: true,
                              limit: 100,
                              lower_bound: "0",
                              scope: ".3cae.waa",
                              table: "sassets",
                              table_key: "string",
                              upper_bound: "-1"
                          }).then(res => console.log(res));*/
			/*this.loginEOSService.eos.contract('simpleassets', {
        	    accounts: [this.loginEOSService.network]
        	}).then(contract => {
        		console.log(contract);
        	    contract.transferf(".3cae.waa", 'simplemarket', 'ilovekolobok', "10.00000000 WAX", 'memo test', this.loginEOSService.options)
        	            .then(result => console.log(result))
        	}).catch(err => {
        		console.error(err);
        	});*/
		});
	}

	
}
