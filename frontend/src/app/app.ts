import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Shell } from './shared/shell/shell';
import { TokenService } from './core/services/token';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Shell],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly tokenService = inject(TokenService);
}
