import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { mapStyle } from 'src/app/utils/mapStyle';
import { Observable } from 'rxjs';

declare var google: any;
var mapBox$ = new BehaviorSubject<any>({ lat: null, lng: null });
function initMap(latitude: number, longitude: number): void {
  const myLatLng = { lat: latitude, lng: longitude };
  mapBox$.next(myLatLng);

  const map = new google.maps.Map(
    document.getElementById('map') as HTMLElement,
    {
      zoom: 15,
      center: myLatLng,
      disableDefaultUI: true,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: mapStyle,
    }
  );

  let preMark: any = new google.maps.Marker({
    position: myLatLng,
    map,
  });

  map.addListener('click', (mapsMouseEvent: any) => {
    preMark.setMap(null);
    preMark = new google.maps.Marker({
      position: mapsMouseEvent.latLng,
      map,
    });
    searchAddress(mapsMouseEvent.latLng.toJSON());
  });

  const input = document.getElementById('pac-input');
  const searchBox = new google.maps.places.SearchBox(input);

  map.addListener('bounds_changed', () => {
    searchBox.setBounds(map.getBounds());
  });

  searchBox.addListener('places_changed', () => {
    const places = searchBox.getPlaces();
    console.log(places);
    const loc = {
      lat: places[0].geometry.location.lat(),
      lng: places[0].geometry.location.lng(),
    };
    preMark.setMap(null);
    preMark = new google.maps.Marker({
      position: loc,
      map,
    });
    initMap(loc.lat, loc.lng);

    searchAddress(loc);
  });
}

function searchAddress(searchData: any) {
  mapBox$.next(searchData);
}

declare global {
  interface Window {
    initMap: (latitude: number, longitude: number) => void;
  }
}

window.initMap = initMap;

@Component({
  selector: 'app-map-point',
  templateUrl: './map-point.component.html',
  styleUrls: ['./map-point.component.css']
})
export class MapPointComponent {

  constructor(){
    
  }

  ngOninit(){
    this.requestLocationPermission();
    initMap(9.9252007,78.1197754)
  }
  

   requestLocationPermission(): void {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("Geolocation success:", position);
    
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
    
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
    
            localStorage.setItem("latitude", latitude.toString());
            localStorage.setItem("longitude", longitude.toString());
    
           
          },
          (error) => {
            console.error("Error getting location:", error);
    
            let errorMessage = "Fehler beim Abrufen des Standorts.";
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = "Standortzugriff wurde verweigert.";
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = "Standortinformationen sind nicht verfügbar.";
                break;
              case error.TIMEOUT:
                errorMessage = "Zeitüberschreitung beim Abrufen des Standorts.";
                break;
              default:
                errorMessage = "Ein unbekannter Fehler ist aufgetreten.";
                break;
            }
    
            // Swal.fire({
            //   title: 'Fehler!',
            //   text: errorMessage,
            //   icon: 'error',
            //   confirmButtonText: 'ok'
            // });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } else {
        // Swal.fire({
        //   title: 'Fehler!',
        //   text: 'Ihr Gerät unterstützt keine Standortbestimmung.',
        //   icon: 'error',
        //   confirmButtonText: 'ok'
        // });
      }
    }



}
