import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './auth/auth.guard';
import { BranchCreateComponent} from './branch/branch-create/branch-create.component' ;
import { BranchListComponent } from './branch/branch-list/branch-list.component';
import { BranchUpdateComponent } from './branch/branch-update/branch-update.component';
import { WaterMeterCreateComponent } from './watermeter/create/watermeter-create.component';
import { WaterMeterListComponent } from './watermeter/display/watermeter-list.component';
import { WaterMeterUpdateComponent } from './watermeter/update/watermeter-update.component';
import { DisplayWaterConsumptionComponent } from './WaterConsumption/display-water-consumption/display-water-consumption.component';
import { CreateWaterConsumptionComponent } from './WaterConsumption/create-water-consumption/create-water-consumption.component';
import { UpdateWaterConsumptionComponent } from './WaterConsumption/update-water-consumption/update-water-consumption.component';

import { HomeComponent } from './pages/home/home.component';
import { DocumentationComponent } from './pages/documentation/documentation.component';
import { TunisiaMapComponent } from './branch/tunisia-map/tunisia-map.component';
import { ChartsComponent } from './WaterConsumption/charts/charts.component';



export const routes: Routes = [
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'documentation', component: DocumentationComponent },
  { path: 'branches/create', component: BranchCreateComponent, canActivate: [authGuard] },
  { path: 'branches/list', component: BranchListComponent, canActivate: [authGuard] },
  { path: 'branches/update/:id', component: BranchUpdateComponent, canActivate: [authGuard] },
  { path: 'watermeter/create', component: WaterMeterCreateComponent, canActivate: [authGuard] },
  { path: 'watermeter/list', component: WaterMeterListComponent,canActivate: [authGuard] },
  { path: 'watermeter/edit/:id', component: WaterMeterUpdateComponent,canActivate: [authGuard] },
  { path: 'waterconsumption/list', component: DisplayWaterConsumptionComponent,canActivate: [authGuard] },
  { path: 'waterconsumption/create', component: CreateWaterConsumptionComponent,canActivate: [authGuard] },
  { path: 'waterconsumption/update/:id', component: UpdateWaterConsumptionComponent,canActivate: [authGuard] },
  { path: 'waterconsumption/charts/:branchId', component: ChartsComponent, canActivate: [authGuard] },
  { path: 'branches-map', component: TunisiaMapComponent,canActivate: [authGuard] },
  
  
  
  {
  path: 'profile',
  loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
},

  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { 
    path: '', 
    redirectTo: 'home', 
    pathMatch: 'full' 
  },
  { 
    path: '**', 
    redirectTo: 'home' 
  }
];