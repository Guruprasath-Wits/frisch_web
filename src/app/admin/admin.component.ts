import { Component,OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserservivceService } from '../userservivce.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  userform:FormGroup |any
  constructor(private service:UserservivceService,private fb:FormBuilder){}
  ngOnInit(): void {
    this.userform=this.fb.group({
      email:[null,Validators.required],
      hash:[null,Validators.required],
      })
  }

  submit(){
    console.log(this.userform.value)
  if(this.userform.value.email==null){
      Swal.fire({
        title: 'Error!',
        text: 'Eine E-Mail ist ungültig',
        icon: 'error',
        confirmButtonText: 'ok'
      })
    }
   else if(this.userform.value.hash==null){
      Swal.fire({
        title: 'Fehler!',
        text: 'Eine E-Mail ist ungültig',
        icon: 'error',
        confirmButtonText: 'ok'
      })
    }
    else{
      console.log(this.userform.value)
      if(this.userform.value.email=="admin"){
        Swal.fire({
          title: 'Fehler!',
          text: 'Ungültiger Benutzername',
          icon: 'error',
          confirmButtonText: 'ok'
        })
      }
      else if(this.userform.value.hash==null){
        Swal.fire({
          title: 'Fehler!',
          text: 'Eine E-Mail ist ungültig',
          icon: 'error',
          confirmButtonText: 'ok'
        })
      }
      else{
        Swal.fire({
          title: 'Erfolg!',
          text: "Anmeldung erfolgreich",
          icon: 'success',
          confirmButtonText: 'ok'
        })
      }

    }
    }
}
