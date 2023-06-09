"use strict";

//let map, mapEvent;
class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; //[lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  //e.g. running workout on 14th December 2022
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = "running";
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    //km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

//testing out the classes
//const run1 = new Running([39, -12], 5.2, 24, 178);
//const cycle1 = new Cycling([39, -12], 27, 95, 523);
//console.log(run1, cycle1);

//////////////////////////////////////////////////////////////////
// Application Architecture
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");
class App {
  //private instance properties
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = []; //class field to hold workouts

  constructor() {
    //get user's position
    this._getPosition();

    //Get data from local storage
    this._getLocalStorage();

    //Attach event handlers
    //adding an event listener to the workout input form
    form.addEventListener("submit", this._newWorkout.bind(this));

    //change what's displayed on the form depending on what type of workout is input
    //no need to bind the 'this' keyword because it's not used anywhere within the toggleElevationField method
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
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

    //alternate approach: destructuring
    //const {latitude} = position.coords;

    const coords = [latitude, longitude];

    //whatever string we pass in to the map function must be the
    //id name of an element in our html and it's in that element
    //where the map will be displayed
    //L is the main function that Leaflet gives us as an entry point
    //think of it as the namespace. Has methods that we can use
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel); //second parameter is the zoom level

    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on("click", this._showForm.bind(this));

    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove("hidden");

    //immediately place the cursor on the distance input field
    //for better user experience
    inputDistance.focus();
  }

  _hideForm() {
    //clear the fields on the form
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        " ";
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    //takes an arbitrary number of inputs
    //rest parameter becomes an array
    //in the end, the every method only returns true if
    //this value is true for all of them
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();

    //Get data from form
    //inputType is one of the selected elements
    //'value' has been set to either 'running' or 'cycling'
    //see html file
    const type = inputType.value;

    //input from the fronted is always a string, so we convert to a number using +
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //if activity running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;

      //Check if data is valid
      //if inputs are not numbers
      //we refactor this into the validInputs function above
      if (
        //!Number.isFinite(distance) ||
        //!Number.isFinite(duration) ||
        //!Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert("Inputs have to be positive numbers");

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //if activity cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;

      //elevation can be negative
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert("Inputs have to be positive numbers");
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //add new object to the workout array
    this.#workouts.push(workout);
    console.log(workout);

    //render workout on map as marker
    this._renderWorkoutMarker(workout);

    //render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    //set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  //rendering the workout on the list
  _renderWorkout(workout) {
    //this is the html that's common to both workouts
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    //adding the parts of the html that are different depending on
    //what workout it is
    if (workout.type === "running") {
      html += `
      <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
        `;
    }

    if (workout.type === "cycling") {
      html += `
      <div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>
    </li>
    `;
    }

    form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    // BUGFIX: When we click on a workout before the map has loaded, we get an error. But there is an easy fix:
    if (!this.#map) return;

    //e.target is the element that was clicked
    //we look for the closest parent that has the 'workout' class
    const workoutEl = e.target.closest(".workout");

    //console.log(workoutEl);
    //on the console, we see that the element contains an id attribute
    //we use this id to actually find the workout in the workouts array

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
    // using the public interface
    // workout.click();
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    console.log(data);

    if (!data) return;

    //use the data to restore our workouts array
    this.#workouts = data;

    //render the workouts in the list
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);

      //need to also render the workouts on the map
      //this._renderWorkoutMarker(work); will not work
      //becasue the getLocalStorage() method is executed right at the start and at that point, the map hasn't been created yet
      //so we need to render the markers right after the map has loaded
      //we put this logic in the _loadMap function
    });
  }
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();

/*
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
*/
