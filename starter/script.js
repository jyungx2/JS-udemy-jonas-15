'use strict';

// 241. Rendering Workouts 🥕🍑🍒🍌
// 242. Move to Marker on Click 🍔 - event delegation

// 239. Managing Workout Data: Creating Classes
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10); // object들은 고유의 아이디 번호를 가지고 있어야 한다.
  // Date.now(): current timestamp of right now... => ✅ 현재는 동시에 생성했기 때문에 같은 아이디를
  // 가지지만, Real world로 가면 두 오브젝트가 동시에 같이 생성될 일은 없기 때문에 OKAY..
  // 그런데, 사실 이 맵을 이용하는 유저는 매우 많을 것이기 때문에 같은 시간에 오브젝트를 생성하는 일은 분명히 있을것!
  // => Date.now()를 이용해서 아이디를 생성하는 것은 좋지 않은 생각..
  clicks = 0; // 🍟 (242)
  constructor(coords, distance, duration) {
    // this.date = ...
    // this.id = ...

    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
    // this._setDescription();  // 🍑 setDescription()함수는 Workout클래스에서 만들어지면 안된다!
    // type 변수가 undefined이기 때문.. => 대신, 객체의 type 변수가 만들어질 때마다 정의되는 cycling, running 자식클래스한테 넣어줘야 한다!
  }

  // 🍑 Date(ex. Running on April 14) Description 생성 함수
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  // 🍟 (242)
  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running'; // 🌈 property that's gonna be avaialbe on all the instances..
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    // this.type = 'running' // 🌈 property that's gonna be avaialbe on all the instances..
    this.calcPace(); // return this.pace
    this._setDescription(); // 🍑
  }

  calcPace() {
    // defined in min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling'; // 🌈 property that's gonna be avaialbe on all the instances..
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    // this.type = 'cycling'  // 🌈 property that's gonna be avaialbe on all the instances..
    this.calcSpeed();
    this._setDescription(); // 🍑
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
  #mapZoomLevel = 13;

  constructor() {
    // this.workouts = [];

    this._getPosition();

    form.addEventListener('submit', this._newWorkout.bind(this));

    inputType.addEventListener('change', this._toggleElevationField);

    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)); // 🍔 (242)
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
    let workout; // 👉 3)과 4)에서 공통으로 필요한 코드 => 5)에서 접근하기 위해 맨 위에 선언

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

    this._renderWorkoutMarker(workout); // No need to using bind!
    // 이벤트리스너상에서 콜백함수로서 renderWorkoutMarker()를 부르는게 아니라,
    // renderWorkoutMarker()함수 자체를 this(=object) 상에서 불러오고 있기 때문.

    // 8) Render workout on list //  🥕가장 나중에 추가됨 (241-1)
    this._renderWorkout(workout);

    // 7) Hide form + clear input fields (241-4) 🍌
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden'); // form.hidden class에 애니메이션 속성(transform)이 있어서 엔터키를 딱 누를 때,
    // slide up되는 효과 나타남. -> 우린 이게 싫다! 그냥 아무 효과없이 쏙 사라지고, workout 데이터로만 대체됐으면 좋겠다.
    // 그렇게 하고 싶다면, dirty trick을 쓸수 밖에 없는데,
    // 1. 일단 form의 display = 'none'으로 돌려서 Hidde으로 없앰으로써 slide up효과를 내지 않게 하고,
    // 2. 그 뒤에 어쨌든 html요소에 Hidden은 더해줘야 다른 코드(hidden remove)가 작동하니까 add('hidden')을 넣어준 다음에,
    // 3. form의 display = none -> grid(original property value)로 다시 바꿔주어 마치 우리가 애니메이션 효과는 없이 Hidden을 넣어 없앤 것 처럼 할 수 있는 트릭이다!! 이때, setTimeout()를 사용한 이유는, form요소의 Transition하는데 걸리는 시간이 1초로 설정해놨기 떄문.
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // 6) Render workout on map as marker
  //  📌 234. How to display a map using a third party library called Leaflet.
  // map event안에 있는 latlng 객체 안의 lat, lng 프라퍼티 도출
  // const { lat, lng } = this.#mapEvent.latlng; // ⛱️ 맨 위로 옮기기
  _renderWorkoutMarker(workout) {
    // L.marker~ : map 상에 클릭할 때마다 Marker를 표시하는 코드
    // coords = 이전에 우리가 geolocation으로부터 명시한 map의 센터 -> [lat, lng] 삽입
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false, // 다른 팝업을 생성하려고 클릭했을 때 현재 팝업이 자동으로 닫히는 것을 방지함.
          closeOnClick: false, // 유저가 팝업 이외에 "다른 부분"을 클릭했을 때 지워지는 것을 방지 => 항상 팝업이 떠있도록 false로 설정!
          className: `${workout.type}-popup`, // will define this dynamically sometime. // 🌈 work
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      ) // 💥string이나 html element💥를 넣을 수 있음.
      // workout.distance => +를 이용해 number로 바꿔줬기 때문에 작동❌ 오류 발생..
      // 이 메서드는 대부분의 메서드와 더불어 this키워드를 리턴하므로 메서드 사용이 다음과 같이 chainable하다.
      .openPopup();
  }

  // 🥕 Render workout on list
  _renderWorkout(workout) {
    // we use data properties(data-id) to usually build a bridge btw the use interface and the data we have in our application.
    // 🍑 Date(ex. Running on April 14): generate this description by adding a new method on the workout class. (241-2)
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">Running on April 14</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

    if (workout.type === 'cycling')
      html += ` <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> `;

    // 🍒 workout html 표시! - ul의 자식요소인 form 요소 밑으로 차곡차곡 ✨거꾸로✨ 넣기 (241-3)
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout'); // closest() 안에 . 찍자!!
    // console.log(workoutEl); // 이 요소의 data-id 속성을 사용하여 선택할 것!!

    // Gaurd Clause (modern JS trend)
    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    // claa App객체 상에 정의된 map object를 불러와 setView() 메서드로 지도의 중심을 이동시킨다.
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // Using the public interface
    workout.click();
  }
}

// 📌 238. Refactoring for Project Architecture
// 2️⃣ global EC에 쓰지 말고, constructor안에 넣자!💫
const app = new App();
// app._getPosition();
