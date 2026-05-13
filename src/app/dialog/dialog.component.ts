import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserservivceService } from '../userservivce.service';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.css']
})
export class DialogComponent {
  dialogform :FormGroup  |any
  company_name:string ="";
  description:string = "";
  jobtype:string = "";
  file: File | null = null;
  loading: boolean = false; // Flag variable
  resImage: any ;
  type: any;
  imagedata:any
  IMG: boolean = false; // Flag variable
  IDDATA:any

  constructor(private service:UserservivceService,private fb:FormBuilder,private http:HttpClient, public dialogref: MatDialogRef<DialogComponent>,@Inject(MAT_DIALOG_DATA) public datas : any,){}
  
  ngOnInit(){
    this.dialogform=this.fb.group({
      companyname:[null,Validators.required],
      description:[null,Validators.required],
      jobtype:[null,Validators.required],
      Experience:[null,Validators.required],
      cattype:[null,Validators.required]
    })
  
    this.type=this.datas.type
    console.log(this.type)
    if(this.datas.type==1){
    }
    else{
     this.loading=true
     this.LoadData()
     this.IMG=true
    }
  }

LoadData(){
  this.dialogform.patchValue({
    companyname:this.datas.ids.company_name,
    description:this.datas.ids.description,
    jobtype:this.datas.ids.jobtype,
    Experience:this.datas.ids.Experience,
    cattype:this.datas.ids.cattype
  })
  this.imagedata=this.datas.ids.logo
  this.IDDATA=this.datas.ids._id
}

  upload(event:any){
    
    this.file = event.target.files[0];
    console.log(this.file);
    var image = {}
    this.service.file_Uploads(this.file).subscribe((response: any)  => {
      this.IMG=false
      this.resImage = response.records;
      console.log(this.resImage)
    }
    );
  }
  
  save(e:any){
    e.preventDefault()

    let bodayData ={
      "company_name":this.dialogform.value.companyname,
      "description":this.dialogform.value.description,
      "jobtype":this.dialogform.value.jobtype,
      "Experience":this.dialogform.value.Experience,
      "cattype":this.dialogform.value.cattype,
      "logo":this.resImage
    }
    console.log(bodayData,this.dialogform.value)
    return this.http.post("http://localhost:9906/api/job/add",bodayData).subscribe((resultData:any) => {
      console.log("data",resultData)
      if(resultData.status=="success"){
        Swal.fire({
          title: 'Erfolg!',
          text: "Erfolgreich hinzugefügt! ",
          icon: 'success',
          confirmButtonText: 'ok'
        })
        this.dialogref.close()
      }
      else{
        Swal.fire({
          title: 'Fehler!',
          text: "Ungültig! ",
          icon: 'error',
          confirmButtonText: 'ok'
        })
      }
    })
  }



  update(e:any){
    this.dialogform.value._id=this.datas.ids._id
    e.preventDefault()
    if(this.resImage==null){
      this.dialogform.value.logo=this.imagedata
      
      this.updatedata(this.dialogform.value)
    }
    else{
      this.dialogform.value.logo=this.resImage
      this.updatedata(this.dialogform.value)
    }
  }

  updatedata(data:any){
    console.log(data)
    let bodayData ={
      "company_name":this.dialogform.value.companyname,
      "description":this.dialogform.value.description,
      "jobtype":this.dialogform.value.jobtype,
      "Experience":this.dialogform.value.Experience,
      "cattype":this.dialogform.value.cattype,
      "logo":this.dialogform.value.logo,
      "_id":this.dialogform.value._id,
    }
    this.service.updateData(bodayData,this.dialogform.value._id).subscribe((resultData:any)=>{
      if(resultData.status=="Success"){
        Swal.fire({
          title: 'Erfolg!',
          text: "erfolgreich aktualisiert!",
          icon: 'success',
          confirmButtonText: 'ok'
        })
        this.dialogref.close()
      }
      else{
        Swal.fire({
          title: 'Fehler!',
          text: "Ungültig!",
          icon: 'error',
          confirmButtonText: 'ok'
        })
      }
    })
  }

}
