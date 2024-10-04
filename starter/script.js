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
  // 3️⃣ global EC에 선언한 mapEvent, map을 모두 App class로 만든 객체 안에 프라이빗하게 넣어 외부에서 맘대로 조작할 수 없도록 하자 => private field로 만들자.
  // ⛳️ loadMap메서드 안에서 map(Event) -> this.#map으로 바꿔주자. (더 이상 글로벌 스콥에 있지 않고, 객체 안에 생성되는 것이므로 this keyword 적어줘야함!)
  #mapEvent;
  #map;

  constructor() {
    // 2️⃣ global EC에 쓰지 말고, constructor안에 넣자!💫
    //  이 contstructor 메서드는 새로운 객체가 만들어질 때 즉시 호출된다. 즉 페이지가 로드되자마자 객체가 만들어지기 때문에 함께 실행되는 이 constructor 메서드도 페이지가 로드되자마자 호출된다.
    // Load page -> constructor() -> _getPosition() ... trigger되는 순서
    this._getPosition();

    // 📌 236. Rendering workout inform form
    // form.addEventListener + inputType.addEventListener => 이 둘은 모두 객체 안에서 유저가 해당 이벤트 발생시에 실행되야 하는 코드가 담겨 있음 ->  객체 안에 존재해야 하는 이벤트 리스너 함수..
    // 5️⃣ _newWorkout() 메서드에 기존 함수 넣기
    form.addEventListener('submit', this._newWorkout.bind(this));
    // 💥this keyword = DOM element onto which object it is attached = form element => app object를 가리키지 않는다!💥
    // 이러한 부분들은 우리가 클래스 내에서 이벤트리스너의 this keyword를 다룰 때 항상 조심해야 하는 부분이다!
    // 사실, 실무에서는 클래스내에서 이벤트리스너를 다룰 땐 항상 this 키워드 상에서 bind method를 사용해야할 것..🌟 명심하자!!!!!

    // 6️⃣ _toggleElevationField() 메서드에 기존 함수 넣기
    // 이 함수 내에선 this keyword 사용하지 않기 때문에 bind method사용할 필요 ❌
    inputType.addEventListener('change', this._toggleElevationField);
  }

  // 1️⃣ getPosition 메서드에 우리가 이미 작성해놓은 코드 붙이기 + 첫번째 매개변수에 대한 함수의 바디를 loadMap 메서드에 따로 붙인 후, bind method를 활용해 연결하기.
  _getPosition() {
    // 📌 233. How to use geolocation API? (=internalization, timer API in the browser)
    // But this is the ✨modern one✨ and very easy to use!!
    // 파라미터로 2개의 콜백함수를 받는데, 하나는 유저의 현재위치를 획득하는데 성공했을 때 콜되는 함수, 다른 하나는 데이터획득에 실패했을 때 실행되는 함수이다.
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // ✅4️⃣ bind method로 this -> object 가리키도록 하여 해결
        function () {
          alert('Could not get your position!');
        }
      );
  }

  // 1️⃣ 여기까지만 하면 아무일도 안일어난다. 단지 계획만 세운것일뿐! 이것들이 실제로 동작할 수 있게 실제 오브젝트를 만든 후, getPosition()를 불러와야 한다.
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    // 1. map function의 파라미터: must be the ID name of an element in our HTML.
    // 2. L: Leaflet이 entry point로서 제공하는 main function (L namespace은 우리가 사용가능한 몇개의 메서드를 가지고, 그 중에 하나가 map, titleLayer, marker method인 것)
    // 3. map - setView의 두번째 매개변수: 얼마나 맵이 확대되어 나타나는지의 정도

    console.log(this); // 🚨4️⃣ undefined (In a regular function call, this keyword is set to undefined)
    // this._loadMap: 우리가 직접 부르는 함수가 아닌, getCurrentPosition()함수에 의해 불려진 콜백함수로서, 이 함수 자체는 method call이 아닌, regular function call으로 취급되기 때문에 undefined.
    // ✅ this 키워드를 명시적으로 정해주는 함수 메서드 배웠다. - 근데 여기선 함수를 불러오는 것(Call, apply)이 아닌, 함수 자체를 리턴하고 싶기 때문에 "bind"메서드를 이용해야겠지.
    // 10-Functions........................
    // ⭐️ bind: call method처럼 모든 함수의 this keyword를 set할 수 있게 allow하지만, call과의 차이점은 bind는 call처럼 바로 불러오지 않고 '새로운 함수를 return함으로써' 새로운 normal function을 만든 효과 -> parameter만 넣어 작용⭐️시킬 수 있다.

    // 235. Displaying a Map Marker
    this.#map = L.map('map').setView(coords, 13); // ⛳️
    // map 변수 상에서 이벤트리스너를 불러올 수 있기 때문에 저장한 거였다.
    // map은 leaflet 라이브러리로부터 생성된 특별한 객체이고, 이 객체 상에서 on 속성을 불러올 수 있다. (자바스크립트로부터 온 속성이 아니다!)
    // console.log(map); // 이 안에 'on' property가 존재하는 것을 확인할 수 있다.✅

    // org -> fr/hot 변경하여 맵의 테마를 변경
    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    // 7️⃣ _showform()
    // 💥 this keyword -> bind method이용하여 제대로 된 this 키워드를 명시해주자...💥
    // 여기서 this = #map이기 때문에(on = addEventlistener) app obejct를 가리키도록 bind(this)해주자.
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
    e.preventDefault();

    // 1) Get data from form
    const type = inputType.value; // running or cycling
    const distance = +inputDistance.value; // always comes into a string, so have to convert it to number immediately.
    const duration = +inputDuration.value;

    // 2) Check if data is valid

    // 3) If activity running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // Check if data is valid
      // ✅ This was your go-to whenever you need to "check if st is a number or not".
      if (!Number.isFinite(distance))
        return alert('Inputs have to be positive numbers!');
    }

    // 4) If activity cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
    }

    // 5) Add new object to workout array

    // 6) Render workout on map as marker
    //  📌 234. How to display a map using a third party library called Leaflet.
    // map event안에 있는 latlng 객체 안의 lat, lng 프라퍼티 도출
    const { lat, lng } = this.#mapEvent.latlng;
    // L.marker~ : map 상에 클릭할 때마다 Marker를 표시하는 코드
    // coords = 이전에 우리가 geolocation으로부터 명시한 map의 센터 -> [lat, lng] 삽입
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false, // 다른 팝업을 생성하려고 클릭했을 때 현재 팝업이 자동으로 닫히는 것을 방지함.
          // closeOnClick: false, // 유저가 팝업 이외에 "다른 부분"을 클릭했을 때 지워지는 것을 방지 => 항상 팝업이 떠있도록 false로 설정!
          className: 'running-popup', // will define this dynamically sometime.
        })
      )
      .setPopupContent('Workout') // string이나 html element를 넣을 수 있음.
      // 이 메서드는 대부분의 메서드와 더불어 this키워드를 리턴하므로 메서드 사용이 다음과 같이 chainable하다.
      .openPopup();
    // bindPopup안에 여러 옵션을 포함하는 객체를 넣을 수도 있다.

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
