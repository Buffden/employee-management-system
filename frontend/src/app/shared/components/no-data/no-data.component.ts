import { Component, Input } from '@angular/core';
import { NoDataInfo } from '../../models/table';
import { SampleNoDataInfo } from '../../consts/table.consts';
import { SharedModule } from '../../shared.module';

@Component({
  selector: 'app-no-data',
  imports: [SharedModule],
  templateUrl: './no-data.component.html',
  styleUrl: './no-data.component.css'
})
export class NoDataComponent {
  @Input() noDataInfo: NoDataInfo = SampleNoDataInfo
}
