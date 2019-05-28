import { Component } from '@angular/core';
import { LoginEOSService } from '../../projects/login-eos/src/lib/login-eos.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
	constructor(public loginEOSService: LoginEOSService){};
}
