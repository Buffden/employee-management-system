import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { UserProfileComponent } from './components/user-profile/user-profile.component';

const routes: Routes = [
  { path: '', component: UserProfileComponent },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes), UserProfileComponent], // Import Angular modules and UserProfileComponent
})
export class ProfileModule {}
