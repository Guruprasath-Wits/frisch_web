import { Component,OnInit } from '@angular/core';
import { UserservivceService } from '../userservivce.service';
import { FormControl,FormGroup,FormControlName,FormBuilder, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-postjob',
  templateUrl: './postjob.component.html',
  styleUrls: ['./postjob.component.css']
})
export class PostjobComponent implements OnInit{
  
  postjsobs:FormGroup |any
  BTN:boolean=true
  id:any
  local:any
  data:any
  constructor(
    private service :UserservivceService,
    private formbuilder:FormBuilder,
    ){}
  ngOnInit(): void {
    this.postjsobs=this.formbuilder.group({
      projectname:[null,Validators.required],
      cattype:[null,Validators.required],
      pricing:[null,Validators.required],
      Period:[null,Validators.required],
      linkdetails:[null,Validators.required],
      description:[null,Validators.required]
    })
     this.local=localStorage.getItem("users")
    var users=JSON.parse(this.local)
    this.get_Projects(users)
  }
  file:any
  resImage:any
  onChange(event:any) {
    this.file = event.target.files[0];
    var image = {}
    console.log(this.file)
    this.service.file_Upload(this.file).subscribe(res => {
      this.resImage=res.records
      // this.resImage ='http://localhost:4001/api/products/uploads/videos/'+ res.message.filename;
      console.log(res)
      if(res.status=="success"){
        Swal.fire({
          title: 'Success!',
          text: res.records,
          icon: 'success',
          confirmButtonText: 'ok'
        })
  
      }
      else{
        Swal.fire({
          title: 'INVALID!',
          text: res.records,
          icon: 'error',
          confirmButtonText: 'ok'
        })
  
      }
    }
    );
  }

  submit(){
     this.data=localStorage.getItem("users")
    var users=JSON.parse(this.data)
    this.postjsobs.value.name=users.name
    this.postjsobs.value.userid=users._id
    this.postjsobs.value.document=this.resImage
    console.log(this.postjsobs.value)
    this.service.project_Insert(this.postjsobs.value).subscribe(res => {
      console.log(res)
      if(res.status==="success"){
        Swal.fire({
          title: 'Success!',
          text: res.message,
          icon: 'success',
          confirmButtonText: 'ok'
        })
        localStorage.setItem("authentication","true")
        localStorage.setItem("users",JSON.stringify(res.records))
      }
      else{
        Swal.fire({
          title: 'Error!',
          text: res.message,
          icon: 'error',
          confirmButtonText: 'ok'
        })
      }
    })
  }



  get_Projects(data:any){
    this.service.get_Project(data).subscribe(res => {
      console.log(res)
      if(res.status==="success"){
        this.postjsobs.patchValue({
          projectname:res.records.projectname,
      cattype:res.records.cattype,
      pricing:res.records.pricing,
      Period:res.records.Period,
      linkdetails:res.records.linkdetails,
      description:res.records.description,
      }) 
      this.BTN=true
      this.id=res.records._id
      }
      else{
        this.BTN=false
      }
    })

  }

  update(){
    this.data=localStorage.getItem("users")
    var users=JSON.parse(this.data)
    this.postjsobs.value.name=users.name
    this.postjsobs.value.userid=users._id
    this.postjsobs.value.document=this.resImage
    console.log(this.postjsobs.value)
    this.service.Edit_Project(this.postjsobs.value,this.id).subscribe(res => {
      console.log(res)
      if(res.status==="Success"){
        Swal.fire({
          title: 'Success!',
          text: res.message,
          icon: 'success',
          confirmButtonText: 'ok'
        })
        localStorage.setItem("authentication","true")
        localStorage.setItem("users",JSON.stringify(res.records))
      }
      else{
        Swal.fire({
          title: 'Error!',
          text: res.message,
          icon: 'error',
          confirmButtonText: 'ok'
        })
      }
    })
  }
}
