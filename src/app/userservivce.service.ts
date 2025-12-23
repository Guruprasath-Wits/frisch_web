import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserservivceService {

  url = "http://localhost:4200/api/"
  fileurl = "http://localhost:4200/"

  

  constructor(public http: HttpClient) { }

  getCategoryData(): Observable<any> {
    return this.http.get<any>(this.url);
  }

  userInsert(data: any): Observable<any> {
    return this.http.post(this.url + "user/create", data)
  }
  userAuh(data: any): Observable<any> {
    return this.http.post(this.url + "user/login", data)
  }
  file_Upload(data: any): Observable<any> {
    const formData = new FormData();
    formData.append("myFile", data);
    return this.http.post(this.fileurl + "uploadfile", formData)
  }
  file_Uploads(data: any): Observable<any> {
    const formData = new FormData();
    formData.append("testImage", data);
    return this.http.post(this.fileurl + "upload/videos", formData)
  }

  project_Insert(data: any): Observable<any> {
    return this.http.post(this.url + "project/insert", data)
  }
  get_Project(data: any): Observable<any> {
    return this.http.post(this.url + "project/get", data)
  }
  Edit_Project(data: any, id: any): Observable<any> {
    return this.http.put(this.url + "project/" + id, data)
  }

  createaddress(data: any): Observable<any> {
    return this.http.post(this.url + "address/create", data)
  }

  getAddress(){
    return this.http.get(this.url + "address/read")
  }

  deleteAddress(id: any){
    return this.http.delete(this.url + "address/delete/" + id)
  }

  getData() {
    return this.http.get(this.url + "job/get")
  }

  deletecard(id: any) {
    return this.http.delete(this.url + "job/del/" + id)
  }
  updateData(data: any, id: any): Observable<any> {
    return this.http.put(this.url + "job/put/" + id, data)
  }

}
