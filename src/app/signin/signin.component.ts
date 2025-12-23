import { Component,OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserservivceService } from '../userservivce.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
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
        title: 'Fehler!',
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
      this.service.userAuh(this.userform.value).subscribe((res)=>{
        console.log(res)
        if(res.status==="success"){
          Swal.fire({
            title: 'Erfolg!',
            text: res.message,
            icon: 'success',
            confirmButtonText: 'ok'
          })
          localStorage.setItem("authentication","true")
          localStorage.setItem("users",JSON.stringify(res.records))
        }
        else{
          Swal.fire({
            title: 'Fehler!',
            text: res.message,
            icon: 'error',
            confirmButtonText: 'ok'
          })
        }
      })
    }
  }
}
