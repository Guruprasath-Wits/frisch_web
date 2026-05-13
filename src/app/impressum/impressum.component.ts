import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { DataService } from '../data.service';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
@Component({
  selector: 'app-impressum',
  templateUrl: './impressum.component.html',
  styleUrls: ['./impressum.component.css']
})
export class ImpressumComponent implements OnInit {
  imprintForm!: FormGroup;
  isLoading = false; 
  imprintData:any;

  constructor(private fb: FormBuilder, private settingService: DataService, private titleService: Title, private metaService: Meta){
    this.getSettings();
  }

  ngOnInit() {
    this.titleService.setTitle('Impressum - Frisch für Sie');
    this.metaService.updateTag({ name: 'description', content: 'Rechtliche Informationen und Impressum des Lieferservice Frisch für Sie.' });
  }

  getSettings(): void {
    this.isLoading = true;
    this.settingService.loadImprint().subscribe(
      (response: any) => {
        this.isLoading = false;
        if (response?.status && response.impressum?.length) {
          console.log(response);
          
          this.imprintData = response.impressum[0]; 
          console.log(this.imprintData);
         
        } else {
          console.warn('No imprint data found.');
        }
      },
      (error:any) => {
        this.isLoading = false;
        console.error('Error fetching settings:', error);
        Swal.fire('Error', 'Failed to fetch imprint settings', 'error');
      }
    );
  }

}


