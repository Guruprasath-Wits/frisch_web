import { Component,OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserservivceService } from '../userservivce.service';
import Swal from 'sweetalert2';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {MatDialogRef} from '@angular/material/dialog';
import { UserComponent } from '../user/user.component';
import { DialogComponent } from '../dialog/dialog.component';


@Component({
  selector: 'app-admindashboard',
  templateUrl: './admindashboard.component.html',
  styleUrls: ['./admindashboard.component.css']
})
export class AdmindashboardComponent {
  userform:FormGroup |any
  content:boolean =true
  panelOpenState = false;
  DATAS:any
  constructor(private service:UserservivceService,private fb:FormBuilder,    private dialog: MatDialog,){}
  ngOnInit(): void {
    this.userform=this.fb.group({
      email:[null,Validators.required],
      hash:[null,Validators.required],
      })
      this.LoadData()
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
      if(this.userform.value.email=="admin" && this.userform.value.hash=="admin@123"){
        Swal.fire({
          title: 'Erfolg!',
          text: "Anmeldung erfolgreich!!!",
          icon: 'success',
          confirmButtonText: 'ok'
        })
        this.content=false
      }
      else{
        Swal.fire({
          title: 'Fehler!',
          text: 'Ungültiger Benutzername und Passwort',
          icon: 'error',
          confirmButtonText: 'ok'
        })
      }

    }
    }

    editModal(data:any){
      // console.log("click")
      const matdialog = new MatDialogConfig();
      matdialog.autoFocus = true;
      matdialog.data = {
        type: 2,
        ids:data
      }
      let dialogref = this.dialog.open(DialogComponent, matdialog)
      dialogref.afterClosed().subscribe(result => {
        this.LoadData() 
      })
      
    }
    
openModal(){
  // console.log("click")
  const matdialog = new MatDialogConfig();
  matdialog.autoFocus = true;
  matdialog.data = {
    type: 1
  }
  let dialogref = this.dialog.open(DialogComponent, matdialog)
  dialogref.afterClosed().subscribe(result => {
    this.LoadData() 
  })
  
}

del(id:any){
  Swal.fire({
    icon:"question",
    title: 'Do you want to delete the products?',
    showDenyButton: true,
    showCancelButton: true,
    confirmButtonText: 'Delete',
    denyButtonText: `Don't delete`,
  }).then((result) => {
    if (result.isConfirmed) {
      this.service.deletecard(id).subscribe((res:any)=>{
        Swal.fire('Erfolgreich gelöscht!', '', 'success')
        this.LoadData()
      })
    } else if (result.isDenied) {
      Swal.fire('Nicht löschen!', '', 'info')
    }
  })



  
}

LoadData(){
  this.service.getData().subscribe((res:any)=>{
    console.log(res)
    this.DATAS=res
  })
}

}