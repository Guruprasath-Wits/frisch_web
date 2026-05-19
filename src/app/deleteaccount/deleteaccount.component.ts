import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-deleteaccount',
  templateUrl: './deleteaccount.component.html',
  styleUrls: ['./deleteaccount.component.css']
})
export class DeleteaccountComponent implements OnInit {
  constructor(private dataService: DataService, private fb: FormBuilder, private router: Router) { }

  userId: any
  userData: any = {}
  contractForm!: FormGroup
  contractData: any = {}
  today: string = '';

  ngOnInit() {
    const currentDate = new Date();
    this.today = currentDate.toISOString().split('T')[0];

    this.loadUserData();
    this.initializeForms()
  }

  private initializeForms(): void {
    this.contractForm = this.fb.group({
      termination_date: [null, Validators.required],
      reason: [null, Validators.required],
      password: [null, Validators.required]
    })
  }
password : any
loginData : any
  loadUserData() {
    this.userId = localStorage.getItem('userId');
     this.loginData = localStorage.getItem('loginData');
this.password = JSON.parse(this.loginData)?.password
    this.dataService.getUserData(this.userId).subscribe(
      (response) => {
        if (response.status) {
          this.userData = response.user;
          console.log(this.userData);
        }
      },
      (error) => {
        console.log("Error in Fetching User Data:" + error)
      }
    )
  }

  contractTermination() {
    const currentDate = new Date();
    this.userId = localStorage.getItem('userId');
     if(this.password != this.contractForm.value.password){
          Swal.fire('Fehler', 'Ungültiges Passwort', 'warning')
          return
        }
    this.contractData = {
      // termination_date: this.contractForm.value.termination_date,
      termination_date: currentDate.toISOString().split('T')[0],
      reason: this.contractForm.value.reason,
      password: this.contractForm.value.password,
      username : this.userData.fname,
      email : this.userData.email
    }

    console.log(this.contractData);

    const notification = {
      title: "Termination !",
      reason:this.contractData.reason,
      desc: `${this.userData.username} was Terminate their Subscription !!!`,
      status: 'unread'
    }

    Swal.fire({
      title: "Bist du sicher?",
      text: "Möchten Sie Ihre Dauerbestellung kündigen?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Ja",
      cancelButtonText: "Abbrechen"
    }).then((result) => {
      if (result.isConfirmed) {
        this.dataService.contractTerminate(this.userId, this.contractData).subscribe(
          (response) => {
            if (response.status) {
              Swal.fire({
                title: "Dauerbestellung gekündigt!",
                text: "Ihre Dauerbestellung wurde erfolgreich gekündigt.",
                icon: "success"
              });

              this.dataService.notifyToAdmin(notification).subscribe(
                (response) => {
                  if (response.status) {
                    console.log("notification to admin");
                    this.router.navigate(['/subscribe-order-dashboard']);
                  }
                },
                (error) => {
                  console.log("Failed to notify", error);
                }
              )

              this.router.navigate(['/userdashboard']);
            }
          },
          (error) => {
            Swal.fire({
              title: "Fehler!",
              text: "Keine Dauerbestellung gefunden oder Kündigung fehlgeschlagen!!!",
              icon: "error"
            });
            console.error("Termination error:", error);
          }
        )
      }
    });

    // this.dataService.contractTerminate(this.userId, this.contractData).subscribe(
    //   (response) => {
    //     if (response.status) {
    //       Swal.fire({
    //         title: "Success",
    //         text: "Contract Terminated Successfully",
    //         icon: "success"
    //       });

    //       this.dataService.notifyToAdmin(notification).subscribe(
    //         (response)=>{
    //           if(response.status){
    //             console.log("notification to admin");  
    //             this.router.navigate(['/userdashboard']);              
    //           }
    //         },
    //         (error)=>{
    //           console.log("Failed to notify",error);              
    //         }
    //       )

    //       this.router.navigate(['/userdashboard']);
    //     }
    //   },
    //   (error) => {
    //     console.log("Failed to Terminate !!!", error);
    //   }
    // )

  }

}
