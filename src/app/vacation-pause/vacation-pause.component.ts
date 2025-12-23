import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vacation-pause',
  templateUrl: './vacation-pause.component.html',
  styleUrls: ['./vacation-pause.component.css']
})
export class VacationPauseComponent implements OnInit {
  constructor(private dataService: DataService, private fb: FormBuilder, private router: Router) { }

  vacationPauseForm!: FormGroup

  userId: any;
  minDate: string = '';
  vacationData: any = {}

  ngOnInit(): void {
    this.initializeForms()

    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
    const day = today.getDate().toString().padStart(2, '0');

    this.minDate = `${year}-${month}-${day}`
  }

  private initializeForms(): void {
    this.vacationPauseForm = this.fb.group({
      vacation_from: [null, Validators.required],
      vacation_to: [null, Validators.required]
    })
  }

  vacationPause() {
    this.userId = localStorage.getItem('userId');
    this.vacationData = {
      vacation_start: this.vacationPauseForm.value.vacation_from,
      vacation_end: this.vacationPauseForm.value.vacation_to
    }

    Swal.fire({
      title: "Bist du sicher?",
      text: "Sind Sie sicher, dass Sie das Dauerbestellung pausieren möchten?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ja",
      cancelButtonText: "Abbrechen"
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.vacationPause(this.userId, this.vacationData).subscribe(
          (response) => {
            if (response.status) {
              Swal.fire("Erfolg", "Ihr Dauerbestellung wurde pausiert", "success");
            }

            this.router.navigate(['/subscribe-order-dashboard'])

          },
          (error) => {
            Swal.fire({
              title: "Fehler!",
              text: "Keine Dauerbestellung gefunden oder Pausieren fehlgeschlagen.",
              icon: "error",
            });

            console.log("Failed to Pause !!!", error);
          }
        )
      }
    });
  }

}
