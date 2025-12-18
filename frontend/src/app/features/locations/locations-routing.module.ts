import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LocationListComponent } from './components/location-list/location-list.component';
import { LocationDetailsComponent } from './components/location-details/location-details.component';

const routes: Routes = [
  {
    path: '',
    component: LocationListComponent
  },
  {
    path: ':locationId',
    component: LocationDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LocationsRoutingModule { }

