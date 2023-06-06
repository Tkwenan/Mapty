"use strict";

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

let map, mapEvent;

class App {
  //private instance properties
  #map;
  #mapEvent;

  constructor() {
    this._getPosition();

    //adding an event listener to the workout input form
    form.addEventListener("submit", this._newWorkout.bind(this));

    //change what's displayed on the form depending on what type of workout is input
    //no need to bind the 'this' keyword because it's not used anywhere within the toggleElevationField method
    inputType.addEventListener("change", this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    //destructuring
    //const {latitude} = position.coords;

    const coords = [latitude, longitude];

    //whatever string we pass in to the map function must be the
    //id name of an element in our html and it's in that element
    //where the map will be displayed
    //L is the main function that Leaflet gives us as an entry point
    //think of it as the namespace. Has methods that we can use
    this.#map = L.map("map").setView(coords, 13); //second parameter is the zoom level

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove("hidden");

    //immediately place the cursor on the distance input field
    //for better user experience
    inputDistance.focus();
  }

  _newWorkout(e) {
    e.preventDefault();

    //clear input fields once form has been submitted
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        " ";

    //display the marker
    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "running-popup",
        })
      )
      .setPopupContent("Workout")
      .openPopup();
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }
}

const app = new App();

//Code before refactoring
//once refactored, the first callback in getCurrentPosition goes into the _loadMap function above
// Geolocation API - get user's current position using the browser's geolocation API
//check if it exists in case it's an old browser
if (navigator.geolocation)
  navigator.geolocation.getCurrentPosition(
    function (position) {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      //destructuring
      //const {latitude} = position.coords;

      const coords = [latitude, longitude];

      //whatever string we pass in to the map function must be the
      //id name of an element in our html and it's in that element
      //where the map will be displayed
      //L is the main function that Leaflet gives us as an entry point
      //think of it as the namespace. Has methods that we can use
      map = L.map("map").setView(coords, 13); //second parameter is the zoom level

      L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      L.marker(coords)
        .addTo(map)
        .bindPopup("A pretty CSS popup.<br> Easily customizable.")
        .openPopup();

      //handling clicks on map
      map.on("click", function (mapEv) {
        mapEvent = mapEv;
        form.classList.remove("hidden");

        //immediately place the cursor on the distance input field
        //for better user experience
        inputDistance.focus();
      });
    },
    function () {
      alert("Could not get your position");
    }
  );

//adding an event listener to the workout input form
form.addEventListener("submit", function (e) {
  e.preventDefault();

  //clear input fields once form has been submitted
  inputDistance.value =
    inputDuration.value =
    inputCadence.value =
    inputElevation.value =
      "";

  //display the marker
  const { lat, lng } = mapEvent.latlng;
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: "running-popup",
      })
    )
    .setPopupContent("Workout")
    .openPopup();
});

//change what's displayed on the form depending on what type of workout is input
inputType.addEventListener("change", function () {
  inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
  inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
});
