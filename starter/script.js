'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// 239. Managing Workout Data: Creating Classes
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // object들은 고유의 아이디 번호를 가지고 있어야 한다.
  // Date.now(): current timestamp of right now... => ✅ 현재는 동시에 생성했기 때문에 같은 아이디를
  // 가지지만, Real world로 가면 두 오브젝트가 동시에 같이 생성될 일은 없기 때문에 OKAY..
  // 그런데, 사실 이 맵을 이용하는 유저는 매우 많을 것이기 때문에 같은 시간에 오브젝트를 생성하는 일은 분명히 있을것!
  // => Date.now()를 이용해서 아이디를 생성하는 것은 좋지 않은 생각..
  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...

    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace(); // return this.pace
  }

  calcPace() {
    // defined in min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27, 95, 170);
// console.log(run1, cycling1);
// => ✅ 현재는 동시에 생성했기 때문에 같은 아이디를
// 가지지만, Real world로 가면 두 오브젝트가 동시에 같이 생성될 일은 없기 때문에 OKAY..
// 그런데, 사실 이 맵을 이용하는 유저는 매우 많을 것이기 때문에 같은 시간에 오브젝트를 생성하는 일은 분명히 있을것!
// => Date.now()를 이용해서 아이디를 생성하는 것은 좋지 않은 생각..

////////////////////////////////////
/// Application Architecture
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// 📌 238. Refactoring for Project Architecture
class App {
  #mapEvent;
  #map;
  #workouts = [];

  constructor() {
    // this.workouts = [];

    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // ✅4️⃣ bind method로 this -> object 가리키도록 하여 해결
        function () {
          alert('Could not get your position!');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // 💫 GeolocationPosition 객체 안의 coords Property 이용
    // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    console.log(this);
    console.log(position);

    // 235. Displaying a Map Marker
    this.#map = L.map('map').setView(coords, 13); // ⛳️

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    // 7️⃣ _showform()
    this.#map.on('click', this._showForm.bind(this)); // ⛳️
  }

  // 7️⃣ _showform()
  _showForm(mapE) {
    this.#mapEvent = mapE; // ⛳️
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  // 6️⃣ _toggleElevationField() 메서드에 기존 함수 넣기
  _toggleElevationField() {
    // 우리는 inputType.value가 바뀔 때(=change), 무조건 둘 중 하나가 hidden이고, 다른 하나는 visible하게 하고 싶다.
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  // 5️⃣ _newWorkout() 메서드에 기존 함수 넣기
  _newWorkout(e) {
    // 🤩 every method를 이용한 checking valid numbers 🤩
    // 1. If all the inputs are real numbers
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); // 배열 내 모든 요소가 조건을 만족한다면 true 반환, 하나라도 만족하지 않으면 false (some은 하나라도 만족하면 true )

    // 2. If all the inputs  are positive
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // 1) Get data from form
    const type = inputType.value; // running or cycling
    const distance = +inputDistance.value; // always comes into a string, so have to convert it to number immediately.
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng; // ⛱️ 오브젝트 생성 시 필요한 값들.. 3번 코드 위로 위치 이동!
    let workout;

    // 2) Check if data is valid

    // 3) If activity running, create running object
    // if-else절은 앞으로 많이 보지 못할 것. 가독성이 떨어지고 코드가 지저분해보인다.
    // 그냥 다음과 같이 if()절을 따로따로 하나씩 나눠 쓰자.
    if (type === 'running') {
      const cadence = +inputCadence.value; // +: string => number
      // ✅ Check if data is valid
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');
      // 👉 Number.isFinite(): This was your go-to whenever you need to "check if st is a number or not".
      // 👉 Guard Clause: check for the opposite of what we're originally interested in and if that opposite is true, then we simply return the function immediately. => trait of more modern JS. kind of trend in modern JS..

      // Creating a new object
      workout = new Running([lat, lng], distance, duration, cadence);
      //  this.#workouts.push(workout); // 👉 5)으로 이동
    }

    // 4) If activity cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      // Creating a new object
      workout = new Cycling([lat, lng], distance, duration, elevation);
      //  this.#workouts.push(workout); // 👉 5)으로 이동
    }

    // 5) Add new object to workout array
    this.#workouts.push(workout); // 👉 3)과 4)에서 공통으로 필요한 코드

    // 6) Render workout on map as marker
    //  📌 234. How to display a map using a third party library called Leaflet.
    // map event안에 있는 latlng 객체 안의 lat, lng 프라퍼티 도출
    // const { lat, lng } = this.#mapEvent.latlng; // ⛱️ 맨 위로 옮기기

    // L.marker~ : map 상에 클릭할 때마다 Marker를 표시하는 코드
    // coords = 이전에 우리가 geolocation으로부터 명시한 map의 센터 -> [lat, lng] 삽입
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false, // 다른 팝업을 생성하려고 클릭했을 때 현재 팝업이 자동으로 닫히는 것을 방지함.
          closeOnClick: false, // 유저가 팝업 이외에 "다른 부분"을 클릭했을 때 지워지는 것을 방지 => 항상 팝업이 떠있도록 false로 설정!
          className: 'running-popup', // will define this dynamically sometime.
        })
      )
      .setPopupContent('Workout') // string이나 html element를 넣을 수 있음.
      // 이 메서드는 대부분의 메서드와 더불어 this키워드를 리턴하므로 메서드 사용이 다음과 같이 chainable하다.
      .openPopup();

    // 7) Hide form + clear input fields
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
  }
}

// 📌 238. Refactoring for Project Architecture
// 2️⃣ global EC에 쓰지 말고, constructor안에 넣자!💫
const app = new App();
// app._getPosition();
