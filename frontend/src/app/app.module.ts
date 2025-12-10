import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router'; // Required for router-outlet
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  imports: [BrowserModule, RouterModule, AppRoutingModule], // Import modules here
})
export class AppModule {}
