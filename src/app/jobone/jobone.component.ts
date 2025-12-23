import { Component } from '@angular/core';
import { DataService } from '../data.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';

@Component({
  selector: 'app-jobone',
  templateUrl: './jobone.component.html',
  styleUrls: ['./jobone.component.css']
})
export class JoboneComponent {
  constructor(private dataService: DataService, private route: Router) { }
  isLoading = false; 
    isLogin = localStorage.getItem('isLoggedIn')
  jobs: any = {}
  userData: any = {}
  userId: any

  ngOnInit(): void {
    this.loadAvailableJobs();
    this.loadUserData();
  }

  loadUserData() {
    this.userId = localStorage.getItem('userId');
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

  formatDescription(description: string): string {
    return description.replace(/\n/g, '<br>');
  }

  loadAvailableJobs() {
    this.dataService.getJobsData().subscribe(
      (response) => {
        if (response.status) {
          this.jobs = response.jobs;
          console.log(this.jobs);
        }
      },
      (error) => {
        console.log("Error !!!", error);

      }
    )
  }

  toggleDescription(job: any): void {
    job.showDescription = !job.showDescription;
  }

 applyJob(jobTitle: any): void {
  if (this.isLogin) {
    // this.isLoading = true;
    this.userId = localStorage.getItem('userId');

    if (this.userId) {
      const notification = {
        title: "Job Application !",
        desc: `Job Application from ${this.userData.username}`,
        status: 'unread'
      };

      const jobDetails = {
        job_title: jobTitle,
        username: this.userData.username,
        email: this.userData.email,
        contact: this.userData.phone
      };

      Swal.fire({
        title: "Bist du sicher?",
        text: "Möchten Sie sich für diesen Job bewerben?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Ja, bewerben Sie sich",
        cancelButtonText: "Abbrechen"
        
      }).then((result) => {
        if (result.isConfirmed) {
          this.dataService.applyForJob(jobDetails).subscribe(
            (response) => {
              this.isLoading = false;
              if (response.status) {
                Swal.fire('Erfolg!', "Die Bewerbungs-E-Mail wurde erfolgreich gesendet", 'success');

                this.dataService.notifyToAdmin(notification).subscribe(
                  (response) => {
                    if (response.status) {
                      console.log("Notification sent to admin");
                    }
                  },
                  (error) => {
                    this.isLoading = false;
                    console.log("Failed to notify", error);
                  }
                );
              }
            },
            (error) => {
              this.isLoading = false;
              Swal.fire('Fehler!', "Jobbewerbung fehlgeschlagen!", 'error');
              console.log("Error sending mail", error);
            }
          );
        }
      });
    }
  } else {
    // ❗ Show login warning if not logged in
    Swal.fire({
      title: 'Leider ist etwas schiefgelaufen',
      text: 'Wenn Sie sich auf eine Stelle bei uns bewerben möchten, registrieren Sie sich bitte',
      icon: 'warning',
      confirmButtonText: 'OK'
    }).then(() => {
      this.route.navigate(['/auth']);
    });
  }
}

}