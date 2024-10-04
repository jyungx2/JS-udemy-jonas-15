'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  // global scope에 정의내린 변수들을 App class안으로 가져와 최대한 연결되도록..(수업 때 언급됐던 결합도 높인다는 개념?)
  // 우리는 앱과 관련된 모든 프라퍼티와 메서드를 외부에서 마음대로 조작할 수 없도록 Private하게 유지하고 싶기 때문에 # 붙인다. => 메서드에 존재하는 모든 map, mapEvent에 #을 붙여줘야 한다. => 💥이렇게 this keyword를 사용시, 첫번째 에러 발생💥
  #map;
  #mapEvent;

  constructor() {
    this._getPosition(); // ✨

    // 스크립트가 로드되자마자 만들어져야 코드 -> 유저가 다음과 같은 이벤트를 발생시킬 때마다 실행되어야 하는 코드이기 때문에,  constructor 메서드 안에..
    form.addEventListener('submit', this._newWorkout.bind(this));
    // 🌟 폼을 제출한다는 것은 새로운 운동기록을 만든다는 뜻이니까, 콜백함수 부분을 _newWorkout 메서드에 넣고 여기선 그냥 불러오기만... (this._newWorkout)
    // 💥2️⃣ eventlistener상에서 this = form 을 가리키므로, bind(this)로 this keyword를 현재 생성된 객체(const app = new App())로 명시해줘야 한다!!

    inputType.addEventListener('change', this._toggleElevationField);
    // 👌4️⃣ 이 함수 안에서는 this keyword쓰지 않으므로, bind method 필요없다!
  }

  _getPosition() {
    // Getting the user's current position using geolocation API
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // 💥1️⃣에러 해결 위해 Bind method로 this keyword = 현재 object를 가리키도록 해줌. (더 이상 undefined ❌)
        function () {
          alert('Could not get your position!');
        }
      );
  }

  // just a blueprint of a house until we make a class that creates objects holding the user's data from inputs.
  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(latitude, longitude);

    const coords = [latitude, longitude];

    console.log(this);
    // 밖에서 미리 선언해준 map 배리어블을 최초로 정의해줌!! (값 등록)
    // * L.map()의 파라미터에는 map이 그려질 html 요소의 id값과 동일해야 한다.
    this.#map = L.map('map').setView(coords, 13); // 💥1️⃣ 첫번째 에러 발생
    // this상에 #map 프라퍼티 찾을 수 없다는 에러.
    // this._loadMap : Regular function call (Not a method call Cause we're not calling it ourselves)
    // Regular function call에서 This는 undefined라고 배웠기 때문에 여기서 This = undefined, undefined상에서 #map프라퍼티를 찾는 꼴이 됐으니 에러가 난 것!
    // 👉 bind method 사용하여 this keyword를 명시적으로 지정해주면 해결가능!😍
    // console.log(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this)); // // 💥3️⃣ this keyword will be set to the object onto which the event handler is attached.
    // => 여기선 map Event상에 On 이벤트리스너를 붙였기 때문에, this -> map을 가리키게 된다.
    // ✅ 해결방법: bind method 사용
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    // Submitting a form = Creating a new workout
    // 폼을 제출한다는 것은 새로운 운동기록을 만든다는 뜻이니까!
    e.preventDefault();

    // Clear input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // console.log(mapEvent);
    const { lat, lng } = this.#mapEvent.latlng;

    L.marker([lat, lng])
      .addTo(map)
      .bindPopup({
        maxWidth: 250,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: 'running-popup',
      })
      .setPopupContent('Workout!')
      .openPopup();
  }
}

// data없이는 class App안에 있는 메서드들이 작동 안함!! (그것들은 단지 집을 짓기 우히ㅏㄴ blueprint같은 재료일뿐 알아서 실행되진 않는다!! => 일단 Object자체를 만들어줘야 함)
const app = new App();
// geolocation API를 Trigger하기 위해선 getPosition()메서드가 호출되어야 한다.
// 이걸 부르기 위해 다음과 같이 만들어놓은 객체(app) 상에 getPosition함수를 불러온다.
// 글로벌스콥에 부른 이유는 페이지가 로드되자마자 실행되야 하므로!
app._getPosition(); // ✨
// 근데, 이렇게 글로벌스콥에 쓰지 않고도 페이지가 로드되자마자 바로 실행되도록 클래스 내부에 짤 수 있는 방법이 있다.. 이게 훨씬 깔끔하고 보기 좋은 코드일것!
// app object가 만들어지자마자 실행되는 메서드가 있다. => 'constructor method'
// object는 어쩃든 이 constructor에 의해 만들어지는 것이기 때문에 "객체가 만들어진다?" = "constructor method가 실행된다" 이말과 동일...
