import { NgModule, ModuleWithProviders } from '@angular/core';
import { LoginEOSService } from './login-eos.service';
import { configInterface, configNetworkService } from './login-config.service';
import { LoginEOSComponent } from './login-eos.component';
import { ToastaModule } from 'ngx-toasta';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


@NgModule({
	declarations: [
		LoginEOSComponent
	],
	imports: [
		ToastaModule.forRoot(),
		CommonModule,
		FormsModule
	],
	exports: [LoginEOSComponent],
	bootstrap: [LoginEOSComponent]
})
export class LoginEOSModule {
	static forRoot(config: configInterface): ModuleWithProviders<LoginEOSModule> {
		return {
			ngModule: LoginEOSModule,
			providers: [
				LoginEOSService,
				{
					provide: configNetworkService,
					useValue: config
				}
			]
		}
	}
}
